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

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

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
    
    // Always create a fresh room for each interview
    // Use session ID from client for stable room naming (useful for debugging)
    const roomName = `interview_${participantIdentity}_${sessionId || Date.now()}`;
    console.log("🟢 API: Creating fresh room:", roomName);

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
        console.log("🟢 API: Room created with metadata");
      } catch (error: any) {
        // Room might already exist (unlikely but handle it), try to update metadata
        console.log("🟡 API: Room exists, updating metadata");
        try {
          const metadataString = JSON.stringify(agentConfig);
          await roomService.updateRoomMetadata(roomName, metadataString);
          await new Promise((resolve) => setTimeout(resolve, 200));
          console.log("🟢 API: Metadata updated");
        } catch (updateError: any) {
          console.error("❌ API: Error setting room metadata:", updateError.message);
        }
      }
    } else {
      // Create room without metadata
      try {
        await roomService.createRoom({
          name: roomName,
          emptyTimeout: 5 * 60,
          maxParticipants: 10,
        });
        console.log("🟢 API: Room created (no metadata)");
      } catch (error: any) {
        // Room already exists, that's fine
        console.log("🟡 API: Room already exists:", roomName);
      }
    }

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };

    console.log("🟢 API: Sending response:");
    console.log("🟢 API: Server URL:", LIVEKIT_URL);
    console.log("🟢 API: Room name:", roomName);

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
