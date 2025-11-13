"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadDocument } from "@/lib/hooks/use-documents";

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentTypeId: string;
  documentTypeName: string;
  visaType?: string;
  onUploadSuccess?: () => void;
}

export function DocumentUploadDialog({
  isOpen,
  onClose,
  documentTypeId,
  documentTypeName,
  visaType = "student",
  onUploadSuccess,
}: DocumentUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const uploadMutation = useUploadDocument();

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Invalid file type. Please upload PDF, DOC, DOCX, TXT, JPG, or PNG files.";
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return "File is too large. Maximum size is 50MB.";
    }

    return null;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      setError(error);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = () => {
    if (!file) return;

    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentTypeId", documentTypeId);
    formData.append("visaType", visaType);

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        onUploadSuccess?.();
        handleClose();
      },
      onError: (error: Error) => {
        setError(error.message);
      },
    });
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setIsDragging(false);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="pr-8">Upload {documentTypeName}</DialogTitle>
          <DialogDescription className="pr-8">
            Upload your document for {documentTypeName.toLowerCase()}. Maximum file size is 50MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative rounded-lg border-2 border-dashed transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
              ${file ? "bg-muted/50" : ""}
            `}
          >
            {file ? (
              <div className="p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-medium break-words line-clamp-2" 
                      title={file.name}
                      style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                    >
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFile(null)}
                    disabled={uploadMutation.isPending}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">
                  Drag and drop your file here
                </p>
                <p className="text-xs text-muted-foreground mb-4">or</p>
                <label htmlFor="file-upload">
                  <Button size="sm" variant="outline" asChild>
                    <span>Browse Files</span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileInputChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-4">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (max 50MB)
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

