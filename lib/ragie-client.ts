/**
 * Ragie API client for document retrieval and RAG queries
 */

const RAGIE_API_KEY = process.env.RAGIE_API_KEY;
const RAGIE_API_URL = "https://api.ragie.ai";

export interface RagieDocument {
  id: string;
  name: string;
  metadata: Record<string, any>;
  status: string;
  created_at: string;
}

export interface RagieRetrievalResult {
  text: string;
  score: number;
  metadata: Record<string, any>;
}

/**
 * Retrieve documents from a specific partition
 */
export async function getDocumentsFromPartition(
  partition: string
): Promise<RagieDocument[]> {
  if (!RAGIE_API_KEY) {
    throw new Error("RAGIE_API_KEY is not configured");
  }

  try {
    const response = await fetch(
      `${RAGIE_API_URL}/documents?partition=${encodeURIComponent(partition)}`,
      {
        headers: {
          Authorization: `Bearer ${RAGIE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Ragie API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.documents || [];
  } catch (error) {
    console.error("Error fetching documents from Ragie:", error);
    return [];
  }
}

/**
 * Query documents using RAG retrieval
 */
export async function queryDocuments(
  query: string,
  partition: string,
  options?: {
    topK?: number;
    filter?: Record<string, any>;
  }
): Promise<RagieRetrievalResult[]> {
  if (!RAGIE_API_KEY) {
    throw new Error("RAGIE_API_KEY is not configured");
  }

  try {
    const response = await fetch(`${RAGIE_API_URL}/retrievals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RAGIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        partition,
        top_k: options?.topK || 5,
        filter: options?.filter,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ragie API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.scored_chunks || [];
  } catch (error) {
    console.error("Error querying Ragie:", error);
    return [];
  }
}

/**
 * Get full document content by ID
 */
export async function getDocumentContent(
  documentId: string
): Promise<string | null> {
  if (!RAGIE_API_KEY) {
    throw new Error("RAGIE_API_KEY is not configured");
  }

  try {
    const response = await fetch(`${RAGIE_API_URL}/documents/${documentId}`, {
      headers: {
        Authorization: `Bearer ${RAGIE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Ragie API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Ragie returns document with extracted text in 'text' field
    return data.text || null;
  } catch (error) {
    console.error("Error fetching document content:", error);
    return null;
  }
}

/**
 * Get summarized context from interview documents
 * This fetches all documents for an interview and returns a summary
 */
export async function getInterviewDocumentContext(
  interviewId: string
): Promise<string> {
  if (!RAGIE_API_KEY) {
    console.warn("⚠️ RAGIE_API_KEY not configured, skipping document context");
    return "";
  }

  try {
    const partition = `interview-${interviewId.toLowerCase()}`;
    
    // Query for general visa interview context
    const results = await queryDocuments(
      "visa interview application documents personal information education employment",
      partition,
      { topK: 10 }
    );

    if (results.length === 0) {
      console.log("📄 No documents found for interview:", interviewId);
      return "";
    }

    // Build context from retrieved chunks
    const contextParts: string[] = [
      "=== APPLICANT DOCUMENTS ===",
      "The following information was extracted from the applicant's uploaded documents:\n",
    ];

    results.forEach((result, index) => {
      const docName = result.metadata?.fileName || `Document ${index + 1}`;
      contextParts.push(`[${docName}]`);
      contextParts.push(result.text.trim());
      contextParts.push(""); // Empty line between documents
    });

    contextParts.push(
      "=== END APPLICANT DOCUMENTS ===\n",
      "Use this information to ask informed follow-up questions and verify consistency."
    );

    const fullContext = contextParts.join("\n");
    console.log(
      `✅ Built document context: ${results.length} chunks, ${fullContext.length} chars`
    );

    return fullContext;
  } catch (error) {
    console.error("Error building document context:", error);
    return "";
  }
}
