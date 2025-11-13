import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

const RAGIE_API_KEY = process.env.RAGIE_API_KEY;
const RAGIE_API_URL = "https://api.ragie.ai/documents";

export async function POST(req: Request) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!RAGIE_API_KEY) {
      throw new Error("RAGIE_API_KEY is not defined");
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const visaType = formData.get("visaType") as string;
    const categoryId = formData.get("categoryId") as string;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Create a new FormData for Ragie
    const ragieFormData = new FormData();
    ragieFormData.append("file", file);
    
    // Add metadata for Ragie
    const metadata = {
      userId: user.id,
      userName: user.firstName || user.emailAddresses[0]?.emailAddress || "Unknown",
      categoryId,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
    };
    ragieFormData.append("metadata", JSON.stringify(metadata));
    
    // Use partition to segment by visa type
    // Format: visa-{visaType}-user-{userId}
    // This allows querying all user docs for a visa type while keeping them isolated
    // Note: Ragie requires lowercase only (pattern: ^[a-z0-9_-]+$)
    const partition = `visa-${visaType}-user-${user.id.toLowerCase()}`;
    ragieFormData.append("partition", partition);

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
      throw new Error(`Ragie upload failed: ${response.statusText}`);
    }

    const ragieData = await response.json();

    // Return the Ragie document ID
    return NextResponse.json({
      success: true,
      ragieDocumentId: ragieData.id,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading to Ragie:", error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

