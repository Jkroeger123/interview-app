import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_WEBHOOK_SECRET = process.env.LIVEKIT_WEBHOOK_SECRET; // Optional: webhook-specific secret
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_REGION = process.env.AWS_S3_REGION;

// ⚠️ TEMPORARY: Skip signature verification for debugging
// TODO: Re-enable this in production by setting SKIP_WEBHOOK_VERIFICATION=false
const SKIP_WEBHOOK_VERIFICATION = true;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const authHeader = req.headers.get("Authorization");

    let event: any;

    if (SKIP_WEBHOOK_VERIFICATION) {
      // ⚠️ INSECURE: Skip signature verification (for debugging only)
      console.warn("⚠️ WARNING: Webhook signature verification is DISABLED");
      console.warn("⚠️ This is insecure and should only be used for debugging");
      console.warn(
        "⚠️ Set SKIP_WEBHOOK_VERIFICATION=false to re-enable security"
      );

      // Parse the JSON body directly without verification
      event = JSON.parse(body);
    } else {
      // Secure path: Verify webhook signature
      const webhookSecret = LIVEKIT_WEBHOOK_SECRET || LIVEKIT_API_SECRET;

      if (!LIVEKIT_API_KEY || !webhookSecret) {
        console.error("❌ LiveKit credentials not configured");
        throw new Error("LiveKit credentials not configured");
      }

      if (!authHeader) {
        console.error("❌ Webhook: Missing Authorization header");
        return new NextResponse("Unauthorized", { status: 401 });
      }

      console.log("🔐 Verifying webhook signature...");
      const receiver = new WebhookReceiver(LIVEKIT_API_KEY, webhookSecret);
      event = await receiver.receive(body, authHeader);
    }

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

    // Get interview by room name (direct Prisma call)
    const interview = await prisma.interview.findUnique({
      where: { roomName },
    });

    if (!interview) {
      console.error("❌ Interview not found for room:", roomName);
      return;
    }

    // Update recording status (direct Prisma call)
    await prisma.interview.update({
      where: { id: interview.id },
      data: { recordingStatus: "recording" },
    });
  } catch (error) {
    console.error("❌ Error handling egress_started:", error);
  }
}

async function handleEgressUpdated(event: any) {
  try {
    const roomName = event.egressInfo?.roomName;
    const status = event.egressInfo?.status;

    console.log("🔄 Egress updated:", { roomName, status });

    // Update recording status based on egress status (direct Prisma call)
    if (roomName && status) {
      const interview = await prisma.interview.findUnique({
        where: { roomName },
      });

      if (interview) {
        let newStatus: string | null = null;

        if (status === "EGRESS_ACTIVE") {
          newStatus = "recording";
        } else if (status === "EGRESS_ENDING") {
          newStatus = "processing";
        }

        if (newStatus) {
          await prisma.interview.update({
            where: { id: interview.id },
            data: { recordingStatus: newStatus },
          });
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

    // Get interview by room name (direct Prisma call)
    const interview = await prisma.interview.findUnique({
      where: { roomName },
    });

    if (!interview) {
      console.error("❌ Interview not found for room:", roomName);
      return;
    }

    const interviewId = interview.id;

    // Check if egress completed successfully
    if (status === "EGRESS_COMPLETE" && fileResults && fileResults.length > 0) {
      // Build S3 URL for the recording
      const fileResult = fileResults[0];
      const filename = fileResult.filename || `interviews/${interviewId}.mp4`;
      const recordingUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com/${filename}`;

      console.log("✅ Recording completed:", recordingUrl);

      // Update recording status and URL (direct Prisma call to avoid auth issues)
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          recordingStatus: "ready",
          recordingUrl: recordingUrl,
        },
      });

      console.log("✅ Recording status updated to ready");

      // NOTE: AI report generation is handled by the session-report endpoint
      // when the agent sends the transcript. No need to generate it here.
    } else {
      // Egress failed
      console.error("❌ Egress failed:", error || "Unknown error");
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          recordingStatus: "failed",
          status: "failed",
        },
      });
    }
  } catch (error) {
    console.error("❌ Error handling egress_ended:", error);
  }
}
