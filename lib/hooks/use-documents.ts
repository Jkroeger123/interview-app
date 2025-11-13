import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserDocuments,
  uploadDocument,
  deleteDocument,
  checkDocumentStatus,
  checkRagieStatuses,
} from "@/server/document-actions";
import { toast } from "sonner";
import { useEffect } from "react";

// Query keys
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (visaType: string) => [...documentKeys.lists(), visaType] as const,
  status: (documentId: string) => [...documentKeys.all, "status", documentId] as const,
};

// Hook to get user documents (fetches from DB once, no polling)
export function useDocuments(visaType: string = "student") {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: documentKeys.list(visaType),
    queryFn: async () => {
      const result = await getUserDocuments(visaType);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch documents");
      }
      return result.data || [];
    },
    staleTime: 1000, // Consider data stale after 1 second
  });

  // Separate effect to poll Ragie for non-ready documents
  useEffect(() => {
    if (!query.data) return;

    const nonReadyDocs = query.data
      .filter((item) => item.document && item.document.status !== "ready" && item.document.status !== "failed")
      .map((item) => item.document!.id);

    if (nonReadyDocs.length === 0) return;

    console.log(`🔄 Starting Ragie polling for ${nonReadyDocs.length} documents`);

    const pollRagie = async () => {
      try {
        const result = await checkRagieStatuses(nonReadyDocs);
        if (result.success) {
          // Check if any status changed to ready or failed
          const hasChanges = result.results?.some(
            (r) => r.status === "ready" || r.status === "failed"
          );
          
          if (hasChanges) {
            console.log("✅ Document status changed, refreshing list");
            queryClient.invalidateQueries({ queryKey: documentKeys.list(visaType) });
          }
        }
      } catch (error) {
        console.error("Error polling Ragie:", error);
      }
    };

    // Poll immediately
    pollRagie();

    // Then poll every 3 seconds
    const interval = setInterval(pollRagie, 3000);

    return () => {
      console.log("🛑 Stopping Ragie polling");
      clearInterval(interval);
    };
  }, [query.data, queryClient, visaType]);

  return query;
}

// Hook to upload a document
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await uploadDocument(formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to upload document");
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      const visaType = variables.get("visaType") as string || "student";
      
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ queryKey: documentKeys.list(visaType) });
      
      toast.success("Document uploaded", {
        description: "Your document has been uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast.error("Upload failed", {
        description: error.message,
      });
    },
  });
}

// Hook to delete a document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const result = await deleteDocument(documentId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete document");
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate all document lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      
      toast.success("Document deleted");
    },
    onError: (error: Error) => {
      toast.error("Delete failed", {
        description: error.message,
      });
    },
  });
}

// Hook to check document status
export function useDocumentStatus(documentId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: documentKeys.status(documentId),
    queryFn: async () => {
      const result = await checkDocumentStatus(documentId);
      if (!result.success) {
        throw new Error(result.error || "Failed to check status");
      }
      return result;
    },
    enabled,
    // Poll every 3 seconds until status is "ready" or "failed"
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "ready" || status === "failed") {
        return false; // Stop polling
      }
      return 3000; // Keep polling every 3 seconds
    },
  });
}

// Hook to get document counts
export function useDocumentCounts(visaType: string = "student") {
  const { data: documents = [] } = useDocuments(visaType);

  const requiredDocs = documents.filter((d) => d.documentType.isRequired);
  const uploadedCount = documents.filter((d) => d.document !== null).length;
  const requiredUploadedCount = requiredDocs.filter((d) => d.document !== null).length;
  const requiredTotalCount = requiredDocs.length;

  return {
    total: documents.length,
    uploaded: uploadedCount,
    required: requiredUploadedCount,
    requiredTotal: requiredTotalCount,
  };
}

