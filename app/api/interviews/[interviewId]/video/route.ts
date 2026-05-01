import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getInterviewById } from "@/server/interview-actions";

const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_REGION = process.env.AWS_S3_REGION || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: AWS_S3_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
});

interface RouteParams {
  params: Promise<{ interviewId: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!AWS_S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { error: "Video storage not configured" },
      { status: 500 }
    );
  }

  const { interviewId } = await params;

  const interviewResult = await getInterviewById(interviewId);
  if (!interviewResult.success || !interviewResult.interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  const interview = interviewResult.interview;
  if (interview.clerkId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!interview.recordingUrl || interview.recordingStatus !== "ready") {
    return NextResponse.json({ error: "Recording not available" }, { status: 404 });
  }

  // Extract S3 key from the stored URL.
  // Format: https://<bucket>.s3.<region>.amazonaws.com/<key>
  let s3Key: string;
  try {
    const url = new URL(interview.recordingUrl);
    s3Key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  } catch {
    return NextResponse.json({ error: "Invalid recording URL" }, { status: 500 });
  }

  const datePart = new Date(interview.startedAt).toISOString().split("T")[0];
  const filename = `interview-${interview.visaType}-${datePart}.mp4`;

  const signedUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
      ResponseContentType: "video/mp4",
    }),
    { expiresIn: 300 }
  );

  return NextResponse.redirect(signedUrl, 302);
}
