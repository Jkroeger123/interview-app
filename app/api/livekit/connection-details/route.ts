import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  AccessToken,
  type AccessTokenOptions,
  type VideoGrant,
  RoomServiceClient,
  EgressClient,
  EncodedFileOutput,
} from "livekit-server-sdk";
import { RoomConfiguration } from "@livekit/protocol";
import type { ConnectionDetails } from "@/lib/types/livekit";
import { createInterview } from "@/server/interview-actions";
import { prisma } from "@/lib/prisma";
import { INTERVIEW_DURATIONS } from "@/lib/visa-types";

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
      console.warn("⚠️ API: Unauthorized access attempt");
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
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("❌ API: Invalid JSON in request body");
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const agentName: string = body?.room_config?.agents?.[0]?.agent_name;
    const agentConfig = body?.agent_config; // Agent configuration for interview
    const sessionId: string = body?.session_id; // Session ID from client for stable room naming

    console.log("🟢 API: Received connection request");
    console.log("🟢 API: User:", user.id);
    console.log("🟢 API: Agent name:", agentName);
    console.log("🟢 API: Agent config:", agentConfig ? "present" : "missing");
    console.log("🟢 API: Session ID:", sessionId);

    // Generate participant token with user info from Clerk
    const participantName =
      user.firstName || user.emailAddresses[0]?.emailAddress || "User";
    const participantIdentity = user.id;

    // Create room service client
    const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);

    // Get user's internal ID and credits from database FIRST
    // If user doesn't exist, create them (fallback for webhook failures/delays)
    let userId: string;
    let userCredits: number;
    try {
      let dbUser = await prisma.user.findUnique({
        where: { clerkId: participantIdentity },
        select: { id: true, credits: true },
      });

      if (!dbUser) {
        console.warn("⚠️ API: User not in DB, creating from Clerk data...");

        // Extract email from Clerk user
        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) {
          throw new Error("No email found in Clerk user data");
        }

        // Auto-create user (webhook missed or delayed)
        // Use upsert to prevent duplicate key errors if multiple requests arrive simultaneously
        dbUser = await prisma.user.upsert({
          where: { clerkId: participantIdentity },
          update: {}, // No update needed, just return existing
          create: {
            clerkId: participantIdentity,
            email,
            firstName: user.firstName || null,
            lastName: user.lastName || null,
            imageUrl: user.imageUrl || null,
            credits: 0, // New users start with 0 credits
          },
          select: { id: true, credits: true },
        });

        console.log("✅ API: Auto-created user:", dbUser.id);
      }

      userId = dbUser.id;
      userCredits = dbUser.credits;
    } catch (error) {
      console.error("❌ API: Error with user:", error);
      return new NextResponse("Failed to get or create user", { status: 500 });
    }

    // Check credits BEFORE creating room/interview (but don't deduct yet!)
    // Determine credits planned based on interview duration
    const duration = agentConfig?.duration || "standard"; // Default to standard
    const selectedDuration = INTERVIEW_DURATIONS.find(
      (d) => d.value === duration
    );
    const creditsPlanned = selectedDuration?.credits || 10; // Default to 10 credits

    console.log(
      `💳 API: Credits check - Duration: "${duration}", Selected: ${selectedDuration?.label || "NOT FOUND"}, Planned: ${creditsPlanned}, Available: ${userCredits}`
    );

    // Check if user has enough credits (must have credits to start)
    if (userCredits < creditsPlanned) {
      console.warn(
        `⚠️ API: Insufficient credits (need ${creditsPlanned}, have ${userCredits})`
      );
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: creditsPlanned,
          available: userCredits,
          message: `You need ${creditsPlanned} credits for this interview, but only have ${userCredits}. Please purchase more credits.`,
        },
        { status: 402 } // 402 Payment Required
      );
    }

    console.log(
      `✅ API: Credit check passed. Credits will be deducted after interview based on success.`
    );

    // Always create a fresh room for each interview
    // Use session ID from client for stable room naming (useful for debugging)
    const roomName = `interview_${participantIdentity}_${
      sessionId || Date.now()
    }`;
    console.log("🟢 API: Creating fresh room:", roomName);

    // Create interview record BEFORE room (so we have the ID for auto-egress)
    const visaType = agentConfig?.visaType || "student";

    // Create interview with creditsPlanned (not deducted yet!)
    let interviewId: string;
    try {
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const interview = await prisma.interview.create({
        data: {
          userId,
          clerkId: participantIdentity,
          roomName,
          visaType,
          creditsPlanned, // Store planned credits
          creditsDeducted: null, // Will be set after interview completion
          endedBy: null, // Will be set when interview ends
          expiresAt,
          status: "in_progress",
          recordingStatus: "pending",
          transcriptStatus: "pending",
        },
      });

      interviewId = interview.id;
      console.log(
        `✅ API: Created interview record: ${interviewId} (${creditsPlanned} credits planned, will charge after completion)`
      );
    } catch (error) {
      console.error("❌ API: Failed to create interview:", error);
      return new NextResponse("Failed to create interview", { status: 500 });
    }

    if (agentConfig) {
      try {
        const metadataString = JSON.stringify(agentConfig);

        await roomService.createRoom({
          name: roomName,
          emptyTimeout: 5 * 60, // 5 minutes
          maxParticipants: 10,
          metadata: metadataString,
        });

        // Small delay to ensure metadata propagates before agent joins
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log("✅ API: Room created with metadata");
      } catch (error: any) {
        console.error("❌ API: Room creation failed:", error.message);
        return new NextResponse("Failed to create room", { status: 500 });
      }
    } else {
      // Create room without metadata
      try {
        await roomService.createRoom({
          name: roomName,
          emptyTimeout: 5 * 60,
          maxParticipants: 10,
        });
        console.log("✅ API: Room created (no metadata)");
      } catch (error: any) {
        console.error("❌ API: Room creation failed:", error.message);
        return new NextResponse("Failed to create room", { status: 500 });
      }
    }

    // Start recording after room is created
    console.log("🎬 API: Starting egress recording...");
    try {
      const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);

      const egressInfo = await egressClient.startRoomCompositeEgress(roomName, {
        file: new EncodedFileOutput({
          filepath: `interviews/${interviewId}.mp4`,
          output: {
            case: "s3",
            value: {
              accessKey: AWS_ACCESS_KEY_ID,
              secret: AWS_SECRET_ACCESS_KEY,
              bucket: AWS_S3_BUCKET,
              region: AWS_S3_REGION,
            },
          },
        }),
      });

      console.log("✅ API: Egress started:", egressInfo.egressId);

      // Update interview record with egress ID
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          egressId: egressInfo.egressId,
          recordingStatus: "recording",
        },
      });
    } catch (error: any) {
      console.error("❌ API: Failed to start egress:", error.message);
      // Don't fail the entire request - room is created, user can still join
      // Recording just won't be available
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
    // Comprehensive error logging for production debugging
    console.error("❌ API: Connection request failed");
    console.error("❌ API: Error details:", error);

    if (error instanceof Error) {
      console.error("❌ API: Error message:", error.message);
      console.error("❌ API: Error stack:", error.stack);

      // Return user-friendly error message (don't leak internals)
      return new NextResponse(
        `Failed to create interview session: ${error.message}`,
        { status: 500 }
      );
    }

    return new NextResponse("An unexpected error occurred", { status: 500 });
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
