"use client";

import { useState, useEffect } from "react";
import { FileText, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Document {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: string;
  uploadedAt: string;
}

interface DocumentListProps {
  refreshTrigger?: number;
}

export function DocumentList({ refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  // Check status for processing documents
  const checkDocumentStatus = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/status`);
      if (!response.ok) return;
      
      const data = await response.json();
      
      // Update local state if status changed
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId ? { ...doc, status: data.status } : doc
        )
      );
    } catch (error) {
      console.error("Error checking document status:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  // Poll for status updates on processing documents
  useEffect(() => {
    const processingDocs = documents.filter((doc) => doc.status === "processing");
    
    if (processingDocs.length === 0) return;

    // Check status every 5 seconds for processing documents
    const interval = setInterval(() => {
      processingDocs.forEach((doc) => {
        checkDocumentStatus(doc.id);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [documents]);

  const handleDelete = async (documentId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document deleted successfully");
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { variant: "default" | "secondary" | "destructive"; label: string; icon?: React.ReactNode }
    > = {
      processing: { 
        variant: "secondary", 
        label: "Processing",
        icon: <Loader2 className="w-3 h-3 animate-spin" />
      },
      ready: { variant: "default", label: "Ready" },
      failed: { variant: "destructive", label: "Failed" },
    };

    const { variant, label, icon } = statusMap[status] || {
      variant: "secondary" as const,
      label: status,
    };

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading documents...</span>
        </div>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No documents uploaded yet</p>
          <p className="text-sm mt-1">
            Upload your first document to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-4">
            <div className="flex items-center gap-4">
              {/* File icon */}
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{doc.filename}</p>
                  {getStatusBadge(doc.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                </p>
              </div>

              {/* Actions */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(doc.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document from your account and
              from the knowledge base. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

