"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Process and store transcript segments from LiveKit
 */
export async function processTranscript(
  interviewId: string,
  transcriptData: Array<{
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
  }>
) {
  try {
    // Verify interview exists
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new Error("Interview not found");
    }

    // Store transcript segments
    const segments = await prisma.transcriptSegment.createMany({
      data: transcriptData.map((segment) => ({
        interviewId,
        speaker: segment.speaker,
        text: segment.text,
        startTime: segment.startTime,
        endTime: segment.endTime,
      })),
    });

    // Update interview transcript status
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        transcriptStatus: "ready",
      },
    });

    console.log(
      `✅ Processed ${transcriptData.length} transcript segments for interview ${interviewId}`
    );
    return { success: true, count: segments.count };
  } catch (error) {
    console.error("❌ Error processing transcript:", error);
    
    // Mark transcript as failed
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        transcriptStatus: "failed",
      },
    }).catch(console.error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process transcript",
    };
  }
}

/**
 * Get formatted transcript segments for an interview
 */
export async function getTranscriptSegments(interviewId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify interview ownership
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new Error("Interview not found");
    }

    if (interview.clerkId !== user.id) {
      throw new Error("Access denied");
    }

    // Fetch transcript segments
    const segments = await prisma.transcriptSegment.findMany({
      where: { interviewId },
      orderBy: { startTime: "asc" },
    });

    return { success: true, segments };
  } catch (error) {
    console.error("❌ Error fetching transcript:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch transcript",
    };
  }
}

/**
 * Get full transcript as formatted text
 */
export async function getFormattedTranscript(interviewId: string) {
  try {
    const result = await getTranscriptSegments(interviewId);
    if (!result.success || !result.segments) {
      return result;
    }

    // Format as readable text
    const formattedText = result.segments
      .map((segment) => {
        const timestamp = formatTime(segment.startTime);
        const speakerLabel = segment.speaker === "agent" ? "Officer" : "Applicant";
        return `[${timestamp}] ${speakerLabel}: ${segment.text}`;
      })
      .join("\n\n");

    return { success: true, transcript: formattedText, segments: result.segments };
  } catch (error) {
    console.error("❌ Error formatting transcript:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to format transcript",
    };
  }
}

/**
 * Helper function to format seconds as MM:SS
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Update transcript status
 */
export async function updateTranscriptStatus(
  interviewId: string,
  status: "pending" | "processing" | "ready" | "failed"
) {
  try {
    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        transcriptStatus: status,
      },
    });

    console.log("✅ Updated transcript status:", interviewId, status);
    return { success: true, interview };
  } catch (error) {
    console.error("❌ Error updating transcript status:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update transcript status",
    };
  }
}

