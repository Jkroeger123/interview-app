import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReport } from "@/lib/openai-report-generator";

/**
 * POST /api/interviews/session-report
 *
 * Receives session report from LiveKit agent when interview ends.
 * Processes the conversation history to extract transcript segments
 * and saves them to the database, then triggers AI report generation.
 */

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: Request) {
  console.log("📥 Session report POST received");
  console.log("📥 Request method:", request.method);
  console.log("📥 Request headers:", Object.fromEntries(request.headers));
  try {
    const body = await request.json();
    console.log("📥 Request body:", JSON.stringify(body, null, 2));

    const { roomName, sessionReport, recordingInfo } = body;

    console.log("📥 Received session report for room:", roomName);
    console.log("📥 Session report keys:", Object.keys(sessionReport || {}));
    console.log("📥 History:", sessionReport?.history);
    console.log(
      "📥 History items count:",
      sessionReport?.history?.items?.length || 0
    );

    if (recordingInfo) {
      console.log("📹 Recording info received:", recordingInfo);
    }

    if (!roomName || !sessionReport) {
      return NextResponse.json(
        { error: "Missing roomName or sessionReport" },
        { status: 400 }
      );
    }

    // Get interview by room name (direct Prisma call, no auth needed)
    const interview = await prisma.interview.findUnique({
      where: { roomName },
    });

    if (!interview) {
      console.error("❌ Interview not found for room:", roomName);
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    console.log("✅ Found interview:", interview.id);

    // Extract conversation history from session report
    const history = sessionReport.history || {};
    const items = history.items || [];

    console.log(`📝 Processing ${items.length} conversation items...`);

    // Parse and save transcript segments
    const transcriptSegments = [];

    for (const item of items) {
      // Skip non-message items (function calls, etc.)
      if (item.type !== "message") continue;

      const role = item.role; // "user" or "assistant"
      const content = item.content;

      if (!content || content.length === 0) continue;

      // Content can be:
      // 1. Array of strings: ['Hello']
      // 2. Array of objects: [{ type: 'text', text: 'Hello' }]

      let text = "";

      // Handle both formats
      for (const block of content) {
        if (typeof block === "string") {
          // Simple string format
          text += block + " ";
        } else if (typeof block === "object") {
          // Object format with type/text/transcript fields
          const blockText = block.transcript || block.text || "";
          text += blockText + " ";
        }
      }

      text = text.trim();
      if (!text) continue;

      // Extract timing if available
      const startTime = item.start_time || 0;
      const endTime = item.end_time || startTime;

      transcriptSegments.push({
        interviewId: interview.id,
        speaker: role === "user" ? "user" : "agent",
        text: text,
        startTime: startTime,
        endTime: endTime,
      });
    }

    console.log(
      `💾 Saving ${transcriptSegments.length} transcript segments...`
    );

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
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000
    );

    // Update interview status (direct Prisma call)
    const updateData: any = {
      status: "completed",
      endedAt: endTime,
      duration: duration,
    };

    // If agent provided recording info, update it
    if (recordingInfo?.expectedRecordingUrl) {
      console.log(
        "📹 Agent provided expected recording URL:",
        recordingInfo.expectedRecordingUrl
      );
      console.log(
        "📹 Recording will be available at this URL once LiveKit Egress completes (1-2 mins)"
      );

      // Mark as processing and set the expected URL
      // LiveKit webhook will update to "ready" when egress actually finishes
      updateData.recordingStatus = "processing";
      updateData.recordingUrl = recordingInfo.expectedRecordingUrl;
    }

    await prisma.interview.update({
      where: { id: interview.id },
      data: updateData,
    });
    console.log("✅ Interview marked as completed");
    if (recordingInfo?.expectedRecordingUrl) {
      console.log("✅ Recording URL set (will be ready when egress completes)");
    }

    // Generate AI report if we have transcript segments
    if (transcriptSegments.length > 0) {
      console.log("🤖 Generating AI report...");
      console.log(`  - Transcript segments: ${transcriptSegments.length}`);
      console.log(`  - Interview ID: ${interview.id}`);
      console.log(`  - Visa type: ${interview.visaType}`);

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.error(
          "❌ OPENAI_API_KEY not configured - skipping AI report generation"
        );
      } else {
        console.log("✅ OpenAI API key is configured");

        // Format transcript for AI analysis
        const formattedTranscript = transcriptSegments
          .map((segment) => {
            const minutes = Math.floor(segment.startTime / 60);
            const secs = Math.floor(segment.startTime % 60);
            const timestamp = `${minutes.toString().padStart(2, "0")}:${secs
              .toString()
              .padStart(2, "0")}`;
            const speakerLabel =
              segment.speaker === "agent" ? "Officer" : "Applicant";
            return `[${timestamp}] ${speakerLabel}: ${segment.text}`;
          })
          .join("\n\n");

        console.log(
          `  - Formatted transcript length: ${formattedTranscript.length} chars`
        );
        console.log(
          `  - First 200 chars: ${formattedTranscript.substring(0, 200)}...`
        );

        // Generate AI report (MUST await in serverless - function terminates otherwise!)
        console.log("📤 Calling generateReport function...");
        try {
          const report = await generateReport(
            formattedTranscript,
            interview.visaType,
            `Interview duration: ${duration} seconds`
          );
          
          console.log("✅ AI analysis generated successfully!");
          console.log(`  - Overall score: ${report.overallScore}`);
          console.log(`  - Recommendation: ${report.recommendation}`);
          console.log(`  - Strengths count: ${report.strengths.length}`);
          console.log(`  - Weaknesses count: ${report.weaknesses.length}`);
          console.log("💾 Saving report to database...");

          // Save report to database
          await prisma.interviewReport.create({
            data: {
              interviewId: interview.id,
              overallScore: report.overallScore,
              recommendation: report.recommendation,
              strengths: JSON.stringify(report.strengths),
              weaknesses: JSON.stringify(report.weaknesses),
              redFlags: JSON.stringify(report.redFlags),
              timestampedComments: JSON.stringify(report.timestampedComments),
              summary: report.summary,
              generatedAt: new Date(),
            },
          });

          console.log("✅ AI report saved successfully to database");
        } catch (error) {
          console.error("❌ AI report generation failed:");
          console.error("  - Error type:", error?.constructor?.name);
          console.error("  - Error message:", error?.message);
          console.error("  - Full error:", error);
          if (error?.response) {
            console.error("  - API response:", error.response);
          }
        }
      }
    } else {
      console.warn("⚠️ No transcript segments to analyze - skipping AI report");
    }

    return NextResponse.json(
      {
        success: true,
        interviewId: interview.id,
        transcriptSegments: transcriptSegments.length,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error processing session report:", error);
    return NextResponse.json(
      {
        error: "Failed to process session report",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
