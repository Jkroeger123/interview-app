"use client";

import { useRouter } from "next/navigation";
import { useInterview } from "@/lib/contexts/interview-context";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { ChevronLeft, Info } from "lucide-react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useDocumentCounts } from "@/lib/hooks/use-documents";
import { DocumentListV2 } from "@/components/documents/document-list-v2";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadDocumentsPage() {
  const router = useRouter();
  const { configuration } = useInterview();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use React Query hook for document counts
  const documentCount = useDocumentCounts(configuration.visaType || "student");

  if (!configuration.visaType) {
    return null;
  }

  const handleSelectDocumentType = (documentTypeId: string, friendlyName: string) => {
    setSelectedDocumentType({ id: documentTypeId, name: friendlyName });
    setUploadDialogOpen(true);
  };

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCloseDialog = () => {
    setUploadDialogOpen(false);
    setSelectedDocumentType(null);
  };

  const handleNext = () => {
    // Document uploads are optional - user can proceed without uploading
    router.push("/interview-ready");
  };

  const handlePrevious = () => {
    router.push("/configure-interview");
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
          <h1 className="text-4xl font-bold mb-2">Upload Supporting Documents</h1>
          <p className="text-muted-foreground mb-4">
            Upload documents that support your visa application. These will be available to
            the AI interviewer for reference during your practice interview.
          </p>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <CardTitle className="text-base text-blue-900 dark:text-blue-100">
                    Document uploads are optional
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300 mt-1">
                    You can proceed to the interview without uploading documents. However, uploading
                    relevant documents will help the AI interviewer ask more specific questions based
                    on your actual application materials.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {documentCount.requiredTotal > 0 && (
              <CardContent className="pt-0">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Progress:</strong> {documentCount.required} of {documentCount.requiredTotal} required documents uploaded
                </p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Document List */}
        <div className="mb-8">
          <DocumentListV2
            key={refreshKey}
            visaType={configuration.visaType}
            onSelectDocumentType={handleSelectDocumentType}
          />
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

        {/* Upload Dialog */}
        {selectedDocumentType && (
          <DocumentUploadDialog
            isOpen={uploadDialogOpen}
            onClose={handleCloseDialog}
            documentTypeId={selectedDocumentType.id}
            documentTypeName={selectedDocumentType.name}
            visaType={configuration.visaType}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
      </div>
      <Toaster />
    </>
  );
}

