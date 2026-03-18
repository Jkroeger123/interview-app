"use client";

import { useState, useCallback } from "react";
import { useInterview } from "@/lib/contexts/interview-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload,
  X,
  FileText,
  File,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function EphemeralFileUpload() {
  const { configuration, addEphemeralFile, removeEphemeralFile } = useInterview();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadFile(file);
    }
    // Reset input
    e.target.value = "";
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/interviews/upload-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();

      addEphemeralFile({
        id: data.file.id,
        name: data.file.name,
        type: data.file.type,
        size: data.file.size,
        url: data.file.url,
      });

      toast.success(`Uploaded ${file.name}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") return FileText;
    return File;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Upload Documents{" "}
            <span className="text-muted-foreground font-normal">(Optional)</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload PDF documents (DS-160, resume, I-20, etc.) for the AI to reference
            during your interview.
          </p>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => document.getElementById("ephemeral-file-input")?.click()}
        >
          {isUploading ? (
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          )}
          <p className="text-sm font-medium">
            {isUploading
              ? "Uploading..."
              : "Drag and drop files here, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supported: PDF documents (max 20MB each)
          </p>
          <input
            id="ephemeral-file-input"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Uploaded files list */}
        {configuration.ephemeralFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Uploaded Files ({configuration.ephemeralFiles.length})
            </p>
            {configuration.ephemeralFiles.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEphemeralFile(file.id)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
