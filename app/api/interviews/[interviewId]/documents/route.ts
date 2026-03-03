import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const RAGIE_API_KEY = process.env.RAGIE_API_KEY;
const RAGIE_API_URL = "https://api.ragie.ai/documents";

// GET: List all documents for an interview
export async function GET(
  req: Request,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interviewId } = await params;

    // Verify interview belongs to user
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        clerkId: user.id,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Get all documents for this interview
    const documents = await prisma.interviewDocument.findMany({
      where: { interviewId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching interview documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST: Upload a document for an interview
export async function POST(
  req: Request,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!RAGIE_API_KEY) {
      return NextResponse.json(
        { error: "Document service not configured" },
        { status: 500 }
      );
    }

    const { interviewId } = await params;

    // Verify interview belongs to user
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        clerkId: user.id,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Supported: PDF, DOC, DOCX, TXT, JPG, PNG",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB" },
        { status: 400 }
      );
    }

    // Get or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email:
            user.emailAddresses[0]?.emailAddress || `${user.id}@unknown.com`,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          imageUrl: user.imageUrl || undefined,
        },
      });
    }

    // Upload to Ragie with interview-specific partition
    const ragieFormData = new FormData();
    ragieFormData.append("file", file);

    // Metadata for Ragie
    const metadata = {
      userId: user.id,
      interviewId: interview.id,
      roomName: interview.roomName,
      visaType: interview.visaType,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
    };
    ragieFormData.append("metadata", JSON.stringify(metadata));

    // Interview-specific partition: interview-{interviewId}
    // This isolates documents to specific interview sessions
    const partition = `interview-${interview.id.toLowerCase()}`;
    ragieFormData.append("partition", partition);

    console.log("📤 INTERVIEW DOCUMENT UPLOAD:");
    console.log("   Interview ID:", interview.id);
    console.log("   File:", file.name);
    console.log("   File Type:", file.type);
    console.log("   File Size:", file.size);
    console.log("   Visa Type:", interview.visaType);
    console.log("   Partition:", partition);

    // Upload to Ragie
    const ragieResponse = await fetch(RAGIE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RAGIE_API_KEY}`,
      },
      body: ragieFormData,
    });

    if (!ragieResponse.ok) {
      const errorText = await ragieResponse.text();
      console.error("Ragie upload failed:", errorText);
      return NextResponse.json(
        { error: `Upload failed: ${ragieResponse.statusText}` },
        { status: 500 }
      );
    }

    const ragieData = await ragieResponse.json();
    console.log("✅ Ragie upload successful:", ragieData.id);

    // Save to database
    const document = await prisma.interviewDocument.create({
      data: {
        interviewId: interview.id,
        userId: dbUser.id,
        clerkId: user.id,
        filename: file.name,
        ragieFileId: ragieData.id,
        fileSize: file.size,
        mimeType: file.type,
        status: ragieData.status || "processing",
      },
    });

    console.log("✅ Document saved to DB:", document.id);

    return NextResponse.json({
      success: true,
      document,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading interview document:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload document",
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove a document from an interview
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!RAGIE_API_KEY) {
      return NextResponse.json(
        { error: "Document service not configured" },
        { status: 500 }
      );
    }

    const { interviewId } = await params;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID required" },
        { status: 400 }
      );
    }

    // Verify document belongs to user and interview
    const document = await prisma.interviewDocument.findFirst({
      where: {
        id: documentId,
        interviewId,
        clerkId: user.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from Ragie
    try {
      const ragieDeleteResponse = await fetch(
        `${RAGIE_API_URL}/${document.ragieFileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${RAGIE_API_KEY}`,
          },
        }
      );

      if (!ragieDeleteResponse.ok) {
        console.error(
          "Ragie deletion failed:",
          ragieDeleteResponse.statusText
        );
        // Continue with DB deletion even if Ragie fails
      }
    } catch (ragieError) {
      console.error("Error deleting from Ragie:", ragieError);
      // Continue with DB deletion
    }

    // Delete from database
    await prisma.interviewDocument.delete({
      where: { id: documentId },
    });

    console.log("✅ Document deleted:", documentId);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting interview document:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete document",
      },
      { status: 500 }
    );
  }
}
