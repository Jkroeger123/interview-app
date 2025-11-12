"use client";

import { useRouter } from "next/navigation";
import { useInterview } from "@/lib/contexts/interview-context";
import { VISA_TYPES } from "@/lib/visa-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { ChevronLeft, Upload, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function UploadDocumentsPage() {
  const router = useRouter();
  const { configuration, addDocument, removeDocument } = useInterview();
  const [uploading, setUploading] = useState<string | null>(null);

  // Redirect if no visa type is selected
  useEffect(() => {
    if (!configuration.visaType) {
      router.push("/select-visa");
    }
  }, [configuration.visaType, router]);

  if (!configuration.visaType) {
    return null;
  }

  const visaType = VISA_TYPES[configuration.visaType];

  const handleFileUpload = async (categoryId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 10MB for now)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload files smaller than 10MB",
      });
      return;
    }

    setUploading(categoryId);

    try {
      // Upload to Ragie
      const formData = new FormData();
      formData.append("file", file);
      formData.append("visaType", configuration.visaType!);
      formData.append("categoryId", categoryId);

      const response = await fetch("/api/ragie/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { ragieDocumentId } = await response.json();

      const document = {
        id: `${Date.now()}-${Math.random()}`,
        categoryId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        url: URL.createObjectURL(file), // Temporary URL for preview
        ragieDocumentId, // Store Ragie document ID for RAG
      };

      addDocument(document);
      toast.success("Document uploaded", {
        description: `${file.name} has been uploaded successfully`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: "Please try again",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleNext = () => {
    // Document uploads are optional for now (testing phase)
    // The agent can still conduct interviews without uploaded documents
    
    // Check if required documents are uploaded
    // const requiredCategories = visaType.documentCategories.filter((c) => c.required);
    // const uploadedCategories = new Set(configuration.documents.map((d) => d.categoryId));
    // const missingRequired = requiredCategories.filter(
    //   (c) => !uploadedCategories.has(c.id)
    // );

    // if (missingRequired.length > 0) {
    //   toast.warning("Required documents missing", {
    //     description: `Please upload: ${missingRequired.map((c) => c.label).join(", ")}`,
    //   });
    //   return;
    // }

    router.push("/interview-ready");
  };

  const handlePrevious = () => {
    router.push("/configure-interview");
  };

  const getDocumentsForCategory = (categoryId: string) => {
    return configuration.documents.filter((doc) => doc.categoryId === categoryId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full bg-blue-600" />
        <div className="h-1 flex-1 rounded-full bg-blue-600" />
        <div className="h-1 flex-1 rounded-full bg-blue-600" />
        <div className="h-1 flex-1 rounded-full bg-muted" />
      </div>

      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">
          {visaType.name} ({visaType.code})
        </p>
        <h1 className="text-4xl font-bold mb-2">Upload Supporting Documents</h1>
        <p className="text-muted-foreground mb-2">
          Upload documents that support your visa application. These will be referenced during your interview simulation.
        </p>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Document uploads are optional during testing. You can proceed to the interview without uploading any documents. The agent will conduct the interview based on your verbal responses.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {visaType.documentCategories.map((category) => {
          const documents = getDocumentsForCategory(category.id);
          const isUploading = uploading === category.id;

          return (
            <Card key={category.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    {category.label}
                    {/* Uploads are optional during testing */}
                    {/* {category.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )} */}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {category.description}
                  </p>

                  {/* Uploaded documents list */}
                  {documents.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 bg-accent rounded-lg"
                        >
                          <FileText className="size-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {doc.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.fileSize)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 flex-shrink-0"
                            onClick={() => removeDocument(doc.id)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Button
                    variant="outline"
                    className="relative"
                    disabled={isUploading}
                  >
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) =>
                        handleFileUpload(category.id, e.target.files)
                      }
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      disabled={isUploading}
                    />
                    <Upload className="size-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} size="lg">
          <ChevronLeft className="size-4 mr-2" />
          Previous
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleNext} size="lg">
            Skip & Continue
          </Button>
          <Button onClick={handleNext} size="lg">
            Start Interview
          </Button>
        </div>
      </div>
      </div>
      <Toaster />
    </>
  );
}

