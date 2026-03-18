import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_REGION = process.env.AWS_S3_REGION || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_S3_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
});

// Allowed file types for LLM context
// PDFs only - text extracted via pypdf in Python agent
const ALLOWED_TYPES = [
  "application/pdf",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!AWS_S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      console.error("❌ S3 not configured");
      return NextResponse.json(
        { error: "File storage not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Only PDF files are supported.`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "bin";
    const uniqueId = randomUUID();
    const s3Key = `interview-files/${user.id}/${uniqueId}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    console.log(`📤 Uploading file to S3: ${s3Key}`);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        // Set short expiry - files auto-delete after 1 day
        Metadata: {
          "original-filename": file.name,
          "uploaded-by": user.id,
          "uploaded-at": new Date().toISOString(),
        },
      })
    );

    // Generate signed URL (1 hour expiry for agent to fetch)
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: s3Key,
      }),
      { expiresIn: 3600 } // 1 hour
    );

    console.log(`✅ File uploaded: ${file.name} (${file.type}, ${file.size} bytes)`);

    return NextResponse.json({
      success: true,
      file: {
        id: uniqueId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: signedUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
