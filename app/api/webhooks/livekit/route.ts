import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import {
  getInterviewByRoomName,
  updateInterviewRecording,
  updateInterviewStatus,
} from "@/server/interview-actions";
import { generateAIReport } from "@/server/report-actions";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_WEBHOOK_SECRET = process.env.LIVEKIT_WEBHOOK_SECRET; // Optional: webhook-specific secret
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_REGION = process.env.AWS_S3_REGION;

export async function POST(req: Request) {
  try {
    // Use webhook-specific secret if available, otherwise fall back to API secret
    const webhookSecret = LIVEKIT_WEBHOOK_SECRET || LIVEKIT_API_SECRET;

    if (!LIVEKIT_API_KEY || !webhookSecret) {
      console.error("❌ LiveKit credentials not configured");
      console.error("  - API Key:", LIVEKIT_API_KEY ? "Set" : "Missing");
      console.error(
        "  - Webhook Secret:",
        LIVEKIT_WEBHOOK_SECRET ? "Set (custom)" : "Using API secret"
      );
      console.error("  - API Secret:", LIVEKIT_API_SECRET ? "Set" : "Missing");
      throw new Error("LiveKit credentials not configured");
    }

    const body = await req.text();
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      console.error("❌ Webhook: Missing Authorization header");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("🔐 Verifying webhook signature...");
    console.log(
      "  - Using API Key:",
      LIVEKIT_API_KEY?.substring(0, 10) + "..."
    );
    console.log(
      "  - Using Secret type:",
      LIVEKIT_WEBHOOK_SECRET ? "Custom webhook secret" : "API secret"
    );

    // Verify webhook signature
    const receiver = new WebhookReceiver(LIVEKIT_API_KEY, webhookSecret);
    const event = await receiver.receive(body, authHeader);

    console.log("📥 LiveKit webhook received:", event.event);

    // Handle egress-related events
    if (event.event === "egress_started") {
      await handleEgressStarted(event);
    } else if (event.event === "egress_updated") {
      await handleEgressUpdated(event);
    } else if (event.event === "egress_ended") {
      await handleEgressEnded(event);
    } else if (event.event === "track_published") {
      // Handle transcript segments if needed
      // For now, we'll wait for LiveKit's built-in transcription
      console.log("📝 Track published event (potential transcript)");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);

    // If signature verification failed, provide helpful debugging info
    if (error instanceof Error && error.message.includes("signature")) {
      console.error("🔐 Signature verification failed!");
      console.error("  This usually means:");
      console.error(
        "  1. LIVEKIT_API_SECRET in Vercel doesn't match LiveKit Cloud"
      );
      console.error(
        "  2. You need to set LIVEKIT_WEBHOOK_SECRET if using custom webhook secret"
      );
      console.error("  3. Check your LiveKit project settings → Keys");
    }

    return new NextResponse(
      error instanceof Error ? error.message : "Webhook processing failed",
      { status: 500 }
    );
  }
}

async function handleEgressStarted(event: any) {
  try {
    const roomName = event.egressInfo?.roomName;
    const egressId = event.egressInfo?.egressId;

    if (!roomName || !egressId) {
      console.error("❌ Missing room name or egress ID");
      return;
    }

    console.log("🎬 Egress started:", { roomName, egressId });

    // Get interview by room name
    const result = await getInterviewByRoomName(roomName);
    if (!result.success || !result.interview) {
      console.error("❌ Interview not found for room:", roomName);
      return;
    }

    // Update recording status
    await updateInterviewRecording(result.interview.id, "recording");
  } catch (error) {
    console.error("❌ Error handling egress_started:", error);
  }
}

async function handleEgressUpdated(event: any) {
  try {
    const roomName = event.egressInfo?.roomName;
    const status = event.egressInfo?.status;

    console.log("🔄 Egress updated:", { roomName, status });

    // Update recording status based on egress status
    if (roomName && status) {
      const result = await getInterviewByRoomName(roomName);
      if (result.success && result.interview) {
        if (status === "EGRESS_ACTIVE") {
          await updateInterviewRecording(result.interview.id, "recording");
        } else if (status === "EGRESS_ENDING") {
          await updateInterviewRecording(result.interview.id, "processing");
        }
      }
    }
  } catch (error) {
    console.error("❌ Error handling egress_updated:", error);
  }
}

async function handleEgressEnded(event: any) {
  try {
    const roomName = event.egressInfo?.roomName;
    const egressId = event.egressInfo?.egressId;
    const status = event.egressInfo?.status;
    const error = event.egressInfo?.error;
    const fileResults = event.egressInfo?.fileResults;

    console.log("🎬 Egress ended:", { roomName, egressId, status });

    if (!roomName) {
      console.error("❌ Missing room name");
      return;
    }

    // Get interview by room name
    const result = await getInterviewByRoomName(roomName);
    if (!result.success || !result.interview) {
      console.error("❌ Interview not found for room:", roomName);
      return;
    }

    const interviewId = result.interview.id;

    // Check if egress completed successfully
    if (status === "EGRESS_COMPLETE" && fileResults && fileResults.length > 0) {
      // Build S3 URL for the recording
      const fileResult = fileResults[0];
      const filename = fileResult.filename || `interviews/${interviewId}.mp4`;
      const recordingUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com/${filename}`;

      console.log("✅ Recording completed:", recordingUrl);

      // Update recording status and URL
      await updateInterviewRecording(interviewId, "ready", recordingUrl);

      // Update interview status to completed
      await updateInterviewStatus(interviewId, "completed");

      // TODO: Extract transcript from LiveKit
      // For now, we'll need to implement transcript extraction
      // This might come from LiveKit's transcription feature or agent logs

      // Generate AI report (run in background)
      generateAIReport(interviewId)
        .then((reportResult) => {
          if (reportResult.success) {
            console.log("✅ AI report generated for interview:", interviewId);
          } else {
            console.error(
              "❌ Failed to generate AI report:",
              reportResult.error
            );
          }
        })
        .catch((err) => {
          console.error("❌ Error generating AI report:", err);
        });
    } else {
      // Egress failed
      console.error("❌ Egress failed:", error || "Unknown error");
      await updateInterviewRecording(interviewId, "failed");
      await updateInterviewStatus(interviewId, "failed");
    }
  } catch (error) {
    console.error("❌ Error handling egress_ended:", error);
  }
}
