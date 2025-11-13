import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserDocuments,
  uploadDocument,
  deleteDocument,
  checkDocumentStatus,
} from "@/server/document-actions";
import { toast } from "sonner";

// Query keys
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (visaType: string) => [...documentKeys.lists(), visaType] as const,
  status: (documentId: string) => [...documentKeys.all, "status", documentId] as const,
};

// Hook to get user documents
export function useDocuments(visaType: string = "student") {
  return useQuery({
    queryKey: documentKeys.list(visaType),
    queryFn: async () => {
      const result = await getUserDocuments(visaType);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch documents");
      }
      return result.data || [];
    },
    // Poll every 5 seconds if there are processing documents
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      
      const hasProcessingDocs = data.some((item) => {
        const status = item.document?.status;
        return status === "processing" || status === "partitioning" || status === "indexing";
      });
      
      return hasProcessingDocs ? 5000 : false; // 5 seconds if processing, else no polling
    },
  });
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
    refetchInterval: 5000, // Check every 5 seconds
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

