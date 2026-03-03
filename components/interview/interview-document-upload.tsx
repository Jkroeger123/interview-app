"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, File, AlertCircle, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InterviewDocumentUploadProps {
  interviewId: string;
  onDocumentsChange?: () => void;
}

interface UploadedDocument {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: string;
}

export function InterviewDocumentUpload({
  interviewId,
  onDocumentsChange,
}: InterviewDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch existing documents
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  }, [interviewId]);

  // Fetch documents on mount
  useState(() => {
    fetchDocuments();
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `/api/interviews/${interviewId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      toast.success("Document uploaded successfully!");
      setSelectedFile(null);
      await fetchDocuments();
      onDocumentsChange?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(
        `/api/interviews/${interviewId}/documents?documentId=${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document removed");
      await fetchDocuments();
      onDocumentsChange?.();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType.includes("pdf")) return FileText;
    return File;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Upload Documents (Optional)
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload any relevant documents (DS-160, resume, I-20, etc.). The AI
            interviewer will analyze and reference them during your interview.
          </p>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {selectedFile
                ? selectedFile.name
                : "Drag and drop a file here, or click to browse"}
            </p>
            {!selectedFile && (
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOC, DOCX, TXT, JPG, PNG (max 50MB)
              </p>
            )}
            {selectedFile && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>{formatFileSize(selectedFile.size)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            className="hidden"
            id="file-upload"
          />
          <Button
            type="button"
            variant={selectedFile ? "default" : "outline"}
            size="sm"
            className="mt-4"
            onClick={() => {
              if (selectedFile) {
                handleUpload();
              } else {
                document.getElementById("file-upload")?.click();
              }
            }}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : selectedFile ? (
              "Upload Document"
            ) : (
              "Browse Files"
            )}
          </Button>
        </div>

        {/* Uploaded documents list */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Documents</h4>
            <div className="space-y-2">
              {documents.map((doc) => {
                const Icon = getFileIcon(doc.mimeType);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {doc.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                          {doc.status === "processing" && (
                            <span className="ml-2">• Processing...</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {documents.length === 0 && !selectedFile && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">AI Document Analysis</p>
              <p className="text-blue-700 dark:text-blue-300">
                Upload any documents you'd like the interviewer to reference. The
                AI will automatically detect the document type (DS-160, resume,
                I-20, etc.) and use it during your interview.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
