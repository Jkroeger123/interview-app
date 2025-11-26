import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getInterviewByRoomName,
  updateInterviewStatus,
} from "@/server/interview-actions";
import { generateAIReport } from "@/server/report-actions";

/**
 * POST /api/interviews/session-report
 * 
 * Receives session report from LiveKit agent when interview ends.
 * Processes the conversation history to extract transcript segments
 * and saves them to the database, then triggers AI report generation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomName, sessionReport } = body;

    console.log("📥 Received session report for room:", roomName);

    if (!roomName || !sessionReport) {
      return NextResponse.json(
        { error: "Missing roomName or sessionReport" },
        { status: 400 }
      );
    }

    // Get interview by room name
    const interviewResult = await getInterviewByRoomName(roomName);
    if (!interviewResult.success || !interviewResult.interview) {
      console.error("❌ Interview not found for room:", roomName);
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    const interview = interviewResult.interview;
    console.log("✅ Found interview:", interview.id);

    // Extract conversation history from session report
    const history = sessionReport.history || {};
    const items = history.items || [];

    console.log(`📝 Processing ${items.length} conversation items...`);

    // Parse and save transcript segments
    const transcriptSegments = [];

    for (const item of items) {
      // Each item represents a turn in the conversation
      const role = item.role; // "user" or "assistant"
      const content = item.content;

      if (!content || content.length === 0) continue;

      // Content is an array of content blocks
      for (const block of content) {
        if (block.type === "transcript" || block.type === "text") {
          // Extract text and timing info
          const text = block.transcript || block.text || "";
          if (!text.trim()) continue;

          // Timing information (if available)
          const startTime = block.start_time || 0;
          const endTime = block.end_time || startTime;

          transcriptSegments.push({
            interviewId: interview.id,
            speaker: role === "user" ? "user" : "agent",
            text: text.trim(),
            startTime: startTime,
            endTime: endTime,
          });
        }
      }
    }

    console.log(`💾 Saving ${transcriptSegments.length} transcript segments...`);

    // Bulk create transcript segments
    if (transcriptSegments.length > 0) {
      await prisma.transcriptSegment.createMany({
        data: transcriptSegments,
        skipDuplicates: true,
      });
      console.log("✅ Transcript segments saved");
    } else {
      console.warn("⚠️ No transcript segments found in session report");
    }

    // Calculate interview duration
    const startTime = new Date(interview.startedAt);
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Update interview status
    await updateInterviewStatus(interview.id, "completed", endTime, duration);
    console.log("✅ Interview marked as completed");

    // Trigger AI report generation (async, don't wait)
    console.log("🤖 Triggering AI report generation...");
    generateAIReport(interview.id)
      .then((result) => {
        if (result.success) {
          console.log("✅ AI report generated successfully");
        } else {
          console.error("❌ AI report generation failed:", result.error);
        }
      })
      .catch((error) => {
        console.error("❌ AI report generation error:", error);
      });

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      transcriptSegments: transcriptSegments.length,
    });
  } catch (error) {
    console.error("❌ Error processing session report:", error);
    return NextResponse.json(
      {
        error: "Failed to process session report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

