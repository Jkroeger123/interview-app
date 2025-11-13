"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { DocumentListV2 } from "@/components/documents/document-list-v2";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { FileText, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DocumentsPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectDocumentType = (documentTypeId: string, friendlyName: string) => {
    setSelectedDocumentType({ id: documentTypeId, name: friendlyName });
    setUploadDialogOpen(true);
  };

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1); // Trigger reload
  };

  const handleCloseDialog = () => {
    setUploadDialogOpen(false);
    setSelectedDocumentType(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
              <p className="text-muted-foreground">
                Manage your visa application documents
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <CardTitle className="text-base text-blue-900 dark:text-blue-100">
                  Document Management
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300 mt-1">
                  Upload and organize your visa application documents below. These documents
                  will be available to the AI interviewer for reference during your practice interviews.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (max 50MB)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Upload one document per type (replacing will delete the previous version)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Documents are securely stored and processed for interview preparation</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Document List */}
        <DocumentListV2
          key={refreshKey}
          visaType="student"
          onSelectDocumentType={handleSelectDocumentType}
        />

        {/* Upload Dialog */}
        {selectedDocumentType && (
          <DocumentUploadDialog
            isOpen={uploadDialogOpen}
            onClose={handleCloseDialog}
            documentTypeId={selectedDocumentType.id}
            documentTypeName={selectedDocumentType.name}
            visaType="student"
            onUploadSuccess={handleUploadSuccess}
          />
        )}
      </main>
    </div>
  );
}
