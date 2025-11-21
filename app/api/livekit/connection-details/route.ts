import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  AccessToken,
  type AccessTokenOptions,
  type VideoGrant,
  RoomServiceClient,
} from "livekit-server-sdk";
import { RoomConfiguration } from "@livekit/protocol";
import type { ConnectionDetails } from "@/lib/types/livekit";
import { createInterview } from "@/server/interview-actions";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_REGION = process.env.AWS_S3_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    // Parse agent configuration from request body
    const body = await req.json();
    const agentName: string = body?.room_config?.agents?.[0]?.agent_name;
    const agentConfig = body?.agent_config; // Agent configuration for interview
    const sessionId: string = body?.session_id; // Session ID from client for stable room naming

    console.log("🟢 API: Received connection request");
    console.log("🟢 API: Agent name:", agentName);
    console.log("🟢 API: Agent config:", agentConfig ? "present" : "missing");
    console.log("🟢 API: Session ID:", sessionId);

    // Generate participant token with user info from Clerk
    const participantName =
      user.firstName || user.emailAddresses[0]?.emailAddress || "User";
    const participantIdentity = user.id;

    // Create room service client
    const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);

    // Get user's internal ID from database FIRST (needed for interview creation)
    let userId: string;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: participantIdentity },
        select: { id: true },
      });
      if (!dbUser) {
        throw new Error("User not found in database");
      }
      userId = dbUser.id;
    } catch (error) {
      console.error("❌ API: Error fetching user:", error);
      return new NextResponse("User not found", { status: 404 });
    }

    // Always create a fresh room for each interview
    // Use session ID from client for stable room naming (useful for debugging)
    const roomName = `interview_${participantIdentity}_${
      sessionId || Date.now()
    }`;
    console.log("🟢 API: Creating fresh room:", roomName);

    // Create interview record BEFORE room (so we have the ID for auto-egress)
    const visaType = agentConfig?.visaType || "student";
    const interviewResult = await createInterview(
      userId,
      participantIdentity,
      roomName,
      visaType
    );

    if (!interviewResult.success || !interviewResult.interview) {
      console.error("❌ API: Failed to create interview record");
      return new NextResponse("Failed to create interview", { status: 500 });
    }

    const interviewId = interviewResult.interview.id;
    console.log("✅ API: Created interview record:", interviewId);

    // Build auto-egress configuration (will start recording automatically)
    // Note: TypeScript types don't fully match the runtime API, but this structure is correct per LiveKit docs
    const egressConfig: any = {
      room_composite: {
        layout: "speaker",
        output: {
          file: {
            filepath: `interviews/${interviewId}.mp4`,
            type: "FILE_TYPE_MP4",
            s3: {
              access_key: AWS_ACCESS_KEY_ID || "",
              secret: AWS_SECRET_ACCESS_KEY || "",
              bucket: AWS_S3_BUCKET || "",
              region: AWS_S3_REGION || "",
            },
          },
        },
      },
    };

    console.log("🎬 API: Room will be created with auto-egress enabled");
    console.log(
      "🎬 API: Egress config:",
      JSON.stringify(
        {
          room_composite: {
            layout: egressConfig.room_composite.layout,
            output: {
              file: {
                filepath: egressConfig.room_composite.output.file.filepath,
                type: egressConfig.room_composite.output.file.type,
                s3: {
                  bucket: egressConfig.room_composite.output.file.s3.bucket,
                  region: egressConfig.room_composite.output.file.s3.region,
                  access_key: egressConfig.room_composite.output.file.s3.access_key
                    ? "***"
                    : "MISSING",
                  secret: egressConfig.room_composite.output.file.s3.secret
                    ? "***"
                    : "MISSING",
                },
              },
            },
          },
        },
        null,
        2
      )
    );

    if (agentConfig) {
      try {
        const metadataString = JSON.stringify(agentConfig);

        await roomService.createRoom({
          name: roomName,
          emptyTimeout: 5 * 60, // 5 minutes
          maxParticipants: 10,
          metadata: metadataString,
          egress: egressConfig, // Auto-start recording when room is created
        });

        // Small delay to ensure metadata propagates before agent joins
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log("✅ API: Room created with metadata and auto-egress");
      } catch (error: any) {
        console.error("❌ API: Room creation failed:", error.message);
        console.error("❌ API: Full error:", JSON.stringify(error, null, 2));

        // Try creating without egress as fallback
        console.log("🔄 API: Retrying without egress config...");
        try {
          const metadataString = JSON.stringify(agentConfig);
          await roomService.createRoom({
            name: roomName,
            emptyTimeout: 5 * 60,
            maxParticipants: 10,
            metadata: metadataString,
          });
          console.log("✅ API: Room created without egress (fallback)");
        } catch (fallbackError: any) {
          console.error(
            "❌ API: Fallback room creation failed:",
            fallbackError.message
          );
          return new NextResponse("Failed to create room", { status: 500 });
        }
      }
    } else {
      // Create room without metadata but with auto-egress
      try {
        await roomService.createRoom({
          name: roomName,
          emptyTimeout: 5 * 60,
          maxParticipants: 10,
          egress: egressConfig, // Auto-start recording when room is created
        });
        console.log("✅ API: Room created with auto-egress (no metadata)");
      } catch (error: any) {
        console.error("❌ API: Room creation failed:", error.message);
        console.error("❌ API: Full error:", JSON.stringify(error, null, 2));

        // Try creating without egress as fallback
        console.log("🔄 API: Retrying without egress config...");
        try {
          await roomService.createRoom({
            name: roomName,
            emptyTimeout: 5 * 60,
            maxParticipants: 10,
          });
          console.log("✅ API: Room created without egress (fallback)");
        } catch (fallbackError: any) {
          console.error(
            "❌ API: Fallback room creation failed:",
            fallbackError.message
          );
          return new NextResponse("Failed to create room", { status: 500 });
        }
      }
    }

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentName
    );

    // Return connection details with interview ID
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
      interviewId, // Include interview ID for client tracking
    };

    console.log("🟢 API: Sending response:");
    console.log("🟢 API: Server URL:", LIVEKIT_URL);
    console.log("🟢 API: Room name:", roomName);
    console.log("🟢 API: Interview ID:", interviewId);

    const headers = new Headers({
      "Cache-Control": "no-store",
    });

    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };

  at.addGrant(grant);

  if (agentName) {
    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName }],
    });
  }

  // Note: Agent config is set as ROOM metadata (not participant metadata)
  // The agent reads it from ctx.room.metadata when it joins

  return at.toJwt();
}
