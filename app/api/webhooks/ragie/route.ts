import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Ragie Webhook Handler
 * Receives notifications when document processing completes
 * 
 * Ragie sends webhooks for these events:
 * - document.processed: Document has been successfully processed and indexed
 * - document.failed: Document processing failed
 */
export async function POST(req: Request) {
  try {
    // Get webhook secret from environment
    const RAGIE_WEBHOOK_SECRET = process.env.RAGIE_WEBHOOK_SECRET;
    
    // Verify webhook signature (if configured)
    if (RAGIE_WEBHOOK_SECRET) {
      const headersList = await headers();
      const signature = headersList.get("x-ragie-signature");
      
      // TODO: Implement signature verification based on Ragie's documentation
      // For now, we'll log it for debugging
      console.log("Ragie webhook signature:", signature);
    }

    // Parse webhook payload
    // Ragie sends: DocumentUpdateWebhook, DocumentDeleteWebhook, etc.
    // DocumentUpdateWebhook has: { event_type: "document.updated", document: {...} }
    const payload = await req.json();
    console.log("Ragie webhook received:", JSON.stringify(payload, null, 2));

    const eventType = payload.event_type || payload.event || payload.type;
    const documentData = payload.document || payload;
    const documentId = documentData.id || payload.document_id;

    if (!documentId) {
      console.error("No document ID in webhook payload");
      return NextResponse.json(
        { error: "Missing document ID" },
        { status: 400 }
      );
    }

    // Find the document in our database by Ragie file ID
    const document = await prisma.userDocument.findUnique({
      where: { ragieFileId: documentId },
    });

    if (!document) {
      console.warn(`Document not found for Ragie ID: ${documentId}`);
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ received: true });
    }

    // Update document status based on event type and document data
    // Event types from Ragie: document.updated, document.deleted, etc.
    // Document status field: "processing", "ready", "failed"
    let newStatus: string;
    
    // If we have document status directly, use it
    if (documentData.status) {
      if (documentData.status === "ready") {
        newStatus = "ready";
      } else if (documentData.status === "failed" || documentData.errors?.length > 0) {
        newStatus = "failed";
      } else if (documentData.status === "processing" || documentData.status === "indexing") {
        newStatus = "processing";
      } else {
        newStatus = documentData.status;
      }
      console.log(`Document ${documentId} status: ${newStatus}`);
    } else {
      // Fallback to event type if no status field
      switch (eventType) {
        case "document.updated":
          // Check if it's a status update
          newStatus = document?.status || "processing";
          break;
          
        case "document.processed":
        case "document.indexed":
        case "processed":
        case "ready":
          newStatus = "ready";
          break;
          
        case "document.failed":
        case "failed":
        case "error":
          newStatus = "failed";
          break;
          
        case "document.processing":
        case "processing":
          newStatus = "processing";
          break;
          
        default:
          console.warn(`Unknown event type: ${eventType}`);
          return NextResponse.json({ received: true });
      }
    }

    // Update the document status
    await prisma.userDocument.update({
      where: { ragieFileId: documentId },
      data: { status: newStatus },
    });

    console.log(
      `Updated document ${document.id} (${document.filename}) status to: ${newStatus}`
    );

    return NextResponse.json({
      received: true,
      documentId: document.id,
      status: newStatus,
    });
  } catch (error) {
    console.error("Error processing Ragie webhook:", error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Allow webhook to be called without authentication
export const runtime = "nodejs";

