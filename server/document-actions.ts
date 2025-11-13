"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const RAGIE_API_KEY = process.env.RAGIE_API_KEY;
const RAGIE_API_URL = "https://api.ragie.ai/documents";

// Get document types for a specific visa type
export async function getDocumentTypes(visaType: string = "student") {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const documentTypes = await prisma.documentType.findMany({
      where: {
        visaType: visaType,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        internalName: true,
        friendlyName: true,
        description: true,
        isRequired: true,
        sortOrder: true,
      },
    });

    return { success: true, data: documentTypes };
  } catch (error) {
    console.error("Error fetching document types:", error);
    return { success: false, error: "Failed to fetch document types" };
  }
}

// Get user's documents with their types
export async function getUserDocuments(visaType: string = "student") {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get user from DB
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: true, data: [] };
    }

    // Get all document types for this visa
    const documentTypes = await prisma.documentType.findMany({
      where: { visaType },
      orderBy: { sortOrder: "asc" },
      include: {
        documents: {
          where: { userId: dbUser.id },
          orderBy: { uploadedAt: "desc" },
          take: 1, // Only get the latest document for each type
        },
      },
    });

    // Map to a more usable format
    const documentsWithStatus = documentTypes.map((docType) => ({
      documentType: {
        id: docType.id,
        internalName: docType.internalName,
        friendlyName: docType.friendlyName,
        description: docType.description,
        isRequired: docType.isRequired,
        sortOrder: docType.sortOrder,
      },
      document: docType.documents[0] || null,
    }));

    // Log document statuses for debugging
    const uploadedDocs = documentsWithStatus.filter((d) => d.document !== null);
    console.log(
      `📊 getUserDocuments: Found ${uploadedDocs.length} uploaded documents`
    );
    uploadedDocs.forEach((item) => {
      console.log(
        `   - ${item.documentType.friendlyName}: ${item.document?.filename} (status: ${item.document?.status})`
      );
    });

    return { success: true, data: documentsWithStatus };
  } catch (error) {
    console.error("Error fetching user documents:", error);
    return { success: false, error: "Failed to fetch documents" };
  }
}

// Upload document
export async function uploadDocument(formData: FormData) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (!RAGIE_API_KEY) {
      throw new Error("RAGIE_API_KEY is not defined");
    }

    const file = formData.get("file") as File;
    const documentTypeId = formData.get("documentTypeId") as string;
    const visaType = (formData.get("visaType") as string) || "student";

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (!documentTypeId) {
      return { success: false, error: "Document type is required" };
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG",
      };
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "File too large. Maximum size is 50MB" };
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

    // Verify document type exists
    const documentType = await prisma.documentType.findUnique({
      where: { id: documentTypeId },
    });

    if (!documentType) {
      return { success: false, error: "Invalid document type" };
    }

    // Check if user already has a document of this type
    const existingDocument = await prisma.userDocument.findUnique({
      where: {
        userId_documentTypeId: {
          userId: dbUser.id,
          documentTypeId: documentTypeId,
        },
      },
    });

    // Create FormData for Ragie
    const ragieFormData = new FormData();
    ragieFormData.append("file", file);

    const metadata = {
      userId: user.id,
      userName:
        user.firstName || user.emailAddresses[0]?.emailAddress || "Unknown",
      fileName: file.name,
      documentType: documentType.friendlyName,
      uploadedAt: new Date().toISOString(),
    };
    ragieFormData.append("metadata", JSON.stringify(metadata));

    const partition = `visa-${visaType}-user-${user.id.toLowerCase()}`;
    ragieFormData.append("partition", partition);

    console.log("📤 DOCUMENT UPLOAD:");
    console.log("   File:", file.name);
    console.log("   Document Type:", documentType.friendlyName);
    console.log("   Visa Type:", visaType);
    console.log("   User ID:", user.id);
    console.log("   Partition:", partition);
    console.log("   Replacing existing:", existingDocument ? "Yes" : "No");

    // Upload to Ragie
    const response = await fetch(RAGIE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RAGIE_API_KEY}`,
      },
      body: ragieFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ragie upload failed:", errorText);
      return {
        success: false,
        error: `Ragie upload failed: ${response.statusText}`,
      };
    }

    const ragieData = await response.json();
    console.log("✅ Ragie upload successful:");
    console.log("   Ragie Response:", JSON.stringify(ragieData, null, 2));
    console.log("   Ragie File ID:", ragieData.id);
    console.log("   Status from Ragie:", ragieData.status);
    console.log("   Status to save:", ragieData.status || "processing");

    // If replacing, delete old document from Ragie first
    if (existingDocument) {
      try {
        console.log(
          "🗑️ Deleting old document from Ragie:",
          existingDocument.ragieFileId
        );
        const deleteResponse = await fetch(
          `${RAGIE_API_URL}/${existingDocument.ragieFileId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${RAGIE_API_KEY}`,
              partition: partition,
            },
          }
        );
        if (deleteResponse.ok) {
          console.log("✅ Old document deleted from Ragie");
        }
      } catch (error) {
        console.error("Error deleting old document from Ragie:", error);
      }

      // Update existing document
      const updatedDocument = await prisma.userDocument.update({
        where: { id: existingDocument.id },
        data: {
          filename: file.name,
          ragieFileId: ragieData.id,
          fileSize: file.size,
          mimeType: file.type,
          status: ragieData.status || "processing",
          uploadedAt: new Date(),
        },
      });

      console.log("✅ Document updated in DB:", updatedDocument.id);
      revalidatePath("/documents");

      return {
        success: true,
        data: updatedDocument,
        message: "Document replaced successfully",
      };
    } else {
      // Create new document
      const document = await prisma.userDocument.create({
        data: {
          userId: dbUser.id,
          clerkId: user.id,
          documentTypeId: documentTypeId,
          filename: file.name,
          ragieFileId: ragieData.id,
          fileSize: file.size,
          mimeType: file.type,
          status: ragieData.status || "processing",
        },
      });

      console.log("✅ Document saved to DB:", document.id);
      revalidatePath("/documents");

      return {
        success: true,
        data: document,
        message: "Document uploaded successfully",
      };
    }
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload document",
    };
  }
}

// Delete document
export async function deleteDocument(documentId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (!RAGIE_API_KEY) {
      throw new Error("RAGIE_API_KEY is not defined");
    }

    const document = await prisma.userDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    if (document.clerkId !== user.id) {
      return { success: false, error: "Forbidden" };
    }

    const partition = `visa-student-user-${document.clerkId.toLowerCase()}`;

    // Delete from Ragie
    try {
      console.log("🗑️ Deleting from Ragie:");
      console.log("   Ragie File ID:", document.ragieFileId);
      console.log("   Partition:", partition);
      console.log("   Filename:", document.filename);

      const ragieResponse = await fetch(
        `${RAGIE_API_URL}/${document.ragieFileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${RAGIE_API_KEY}`,
            partition: partition,
          },
        }
      );

      if (!ragieResponse.ok && ragieResponse.status !== 404) {
        const errorText = await ragieResponse.text();
        console.error("❌ Ragie deletion failed:");
        console.error("   Status:", ragieResponse.status);
        console.error("   Response:", errorText);
      } else if (ragieResponse.status === 404) {
        console.log("⚠️ Document already deleted from Ragie (404)");
      } else {
        const deleteResponse = await ragieResponse.json();
        console.log("✅ Successfully deleted from Ragie:");
        console.log("   Status:", deleteResponse.status);
      }
    } catch (ragieError) {
      console.error("Error deleting from Ragie:", ragieError);
    }

    // Delete from database
    await prisma.userDocument.delete({
      where: { id: documentId },
    });

    console.log("✅ Document deleted from DB:");
    console.log("   Document ID:", documentId);
    console.log("   Filename:", document.filename);

    revalidatePath("/documents");

    return { success: true, message: "Document deleted successfully" };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}

// Check document status from Ragie
export async function checkDocumentStatus(documentId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (!RAGIE_API_KEY) {
      throw new Error("RAGIE_API_KEY is not defined");
    }

    const document = await prisma.userDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    if (document.clerkId !== user.id) {
      return { success: false, error: "Forbidden" };
    }

    const partition = `visa-student-user-${document.clerkId.toLowerCase()}`;

    console.log("🔍 Checking document status in Ragie:");
    console.log("   Document ID:", documentId);
    console.log("   Ragie File ID:", document.ragieFileId);
    console.log("   Filename:", document.filename);
    console.log("   Current status:", document.status);
    console.log("   Partition:", partition);

    // Query Ragie for status
    const response = await fetch(`${RAGIE_API_URL}/${document.ragieFileId}`, {
      headers: {
        Authorization: `Bearer ${RAGIE_API_KEY}`,
        partition: partition,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to fetch status from Ragie:");
      console.error("   Status:", response.status);
      console.error("   Response:", errorText);
      return {
        success: true,
        status: document.status,
        documentId: document.id,
      };
    }

    const ragieDoc = await response.json();
    console.log("📄 Ragie document response:", ragieDoc);

    let newStatus = document.status;

    if (ragieDoc.status === "ready") {
      newStatus = "ready";
    } else if (ragieDoc.status === "failed" || ragieDoc.errors?.length > 0) {
      newStatus = "failed";
    } else if (
      ragieDoc.status === "processing" ||
      ragieDoc.status === "indexing" ||
      ragieDoc.status === "partitioning"
    ) {
      newStatus = "processing";
    }

    console.log("   Old status:", document.status);
    console.log("   New status:", newStatus);

    if (newStatus !== document.status) {
      await prisma.userDocument.update({
        where: { id: documentId },
        data: { status: newStatus },
      });
      console.log("✅ Updated document status in DB");
    } else {
      console.log("ℹ️ Status unchanged, no DB update needed");
    }

    return { success: true, status: newStatus, documentId: document.id };
  } catch (error) {
    console.error("Error checking document status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check status",
    };
  }
}
