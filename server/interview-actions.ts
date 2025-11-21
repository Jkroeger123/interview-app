"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { EgressClient, EncodedFileOutput } from "livekit-server-sdk";

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_REGION = process.env.AWS_S3_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

/**
 * Create a new interview record when a call starts
 */
export async function createInterview(
  userId: string,
  clerkId: string,
  roomName: string,
  visaType: string
) {
  try {
    const interview = await prisma.interview.create({
      data: {
        userId,
        clerkId,
        roomName,
        visaType,
        status: "in_progress",
        recordingStatus: "pending",
        transcriptStatus: "pending",
      },
    });

    console.log("✅ Created interview record:", interview.id);
    return { success: true, interview };
  } catch (error) {
    console.error("❌ Error creating interview:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create interview",
    };
  }
}

/**
 * Start LiveKit Egress recording for a room
 */
export async function startInterviewRecording(
  interviewId: string,
  roomName: string
) {
  try {
    console.log("🎬 Starting recording for interview:", interviewId, "room:", roomName);
    
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      const error = "LiveKit credentials not configured";
      console.error("❌", error);
      throw new Error(error);
    }

    if (!AWS_S3_BUCKET || !AWS_S3_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      const error = "AWS S3 credentials not configured";
      console.error("❌", error, {
        hasBucket: !!AWS_S3_BUCKET,
        hasRegion: !!AWS_S3_REGION,
        hasAccessKey: !!AWS_ACCESS_KEY_ID,
        hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
      });
      throw new Error(error);
    }

    console.log("✓ All credentials present, creating egress client...");

    console.log("✓ Creating EgressClient with URL:", LIVEKIT_URL);
    const egressClient = new EgressClient(
      LIVEKIT_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );

    console.log("✓ Starting room composite egress for room:", roomName);
    console.log("✓ S3 config:", {
      bucket: AWS_S3_BUCKET,
      region: AWS_S3_REGION,
      filepath: `interviews/${interviewId}.mp4`,
    });

    // Start room composite egress with S3 upload
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

    console.log("✅ Started egress:", egressInfo.egressId);

    // Update interview record with egress ID
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        egressId: egressInfo.egressId,
        recordingStatus: "recording",
      },
    });

    return { success: true, egressId: egressInfo.egressId };
  } catch (error) {
    console.error("❌ Error starting recording:", error);
    
    // Update interview status to failed
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        recordingStatus: "failed",
      },
    }).catch(console.error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start recording",
    };
  }
}

/**
 * Get interview by ID with all related data
 */
export async function getInterviewById(interviewId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        user: true,
        report: true,
        transcriptSegments: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!interview) {
      throw new Error("Interview not found");
    }

    // Check ownership
    if (interview.clerkId !== user.id) {
      throw new Error("Access denied");
    }

    return { success: true, interview };
  } catch (error) {
    console.error("❌ Error fetching interview:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch interview",
    };
  }
}

/**
 * Get all interviews for the current user
 */
export async function getUserInterviews() {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const interviews = await prisma.interview.findMany({
      where: { clerkId: user.id },
      include: {
        report: {
          select: {
            overallScore: true,
            recommendation: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return { success: true, interviews };
  } catch (error) {
    console.error("❌ Error fetching interviews:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch interviews",
    };
  }
}

/**
 * Update interview status when it ends
 */
export async function updateInterviewStatus(
  interviewId: string,
  status: "in_progress" | "completed" | "failed",
  endedAt?: Date,
  duration?: number
) {
  try {
    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status,
        endedAt,
        duration,
      },
    });

    console.log("✅ Updated interview status:", interviewId, status);
    return { success: true, interview };
  } catch (error) {
    console.error("❌ Error updating interview:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update interview",
    };
  }
}

/**
 * End an interview by room name (called when user hangs up)
 */
export async function endInterviewByRoomName(roomName: string) {
  try {
    const interview = await prisma.interview.findUnique({
      where: { roomName },
    });

    if (!interview) {
      console.log("⚠️ Interview not found for room:", roomName);
      return { success: false, error: "Interview not found" };
    }

    // Calculate duration if we have a start time
    const duration = interview.startedAt
      ? Math.floor((Date.now() - interview.startedAt.getTime()) / 1000)
      : null;

    const updated = await prisma.interview.update({
      where: { id: interview.id },
      data: {
        status: "completed",
        endedAt: new Date(),
        duration,
      },
    });

    console.log("✅ Interview ended:", interview.id, "Duration:", duration, "seconds");
    return { success: true, interview: updated };
  } catch (error) {
    console.error("❌ Error ending interview:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to end interview",
    };
  }
}

/**
 * Update interview recording status and URL
 */
export async function updateInterviewRecording(
  interviewId: string,
  recordingStatus: "pending" | "recording" | "processing" | "ready" | "failed",
  recordingUrl?: string
) {
  try {
    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        recordingStatus,
        recordingUrl,
      },
    });

    console.log("✅ Updated recording status:", interviewId, recordingStatus);
    return { success: true, interview };
  } catch (error) {
    console.error("❌ Error updating recording:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update recording",
    };
  }
}

/**
 * Get interview by room name
 */
export async function getInterviewByRoomName(roomName: string) {
  try {
    const interview = await prisma.interview.findUnique({
      where: { roomName },
    });

    return { success: true, interview };
  } catch (error) {
    console.error("❌ Error fetching interview by room:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch interview",
    };
  }
}

/**
 * Delete an interview and all related data
 */
export async function deleteInterview(interviewId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify ownership before deleting
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { clerkId: true },
    });

    if (!interview) {
      throw new Error("Interview not found");
    }

    if (interview.clerkId !== user.id) {
      throw new Error("Access denied");
    }

    // Delete interview (cascade will handle related records: transcript, report)
    await prisma.interview.delete({
      where: { id: interviewId },
    });

    console.log("✅ Deleted interview:", interviewId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting interview:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete interview",
    };
  }
}

