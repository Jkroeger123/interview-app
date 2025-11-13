"use client";

import { FileText, Loader2, Trash2, Upload, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDocuments, useDeleteDocument } from "@/lib/hooks/use-documents";

type DocumentType = {
  id: string;
  internalName: string;
  friendlyName: string;
  description: string | null;
  isRequired: boolean;
  sortOrder: number;
};

type UserDocument = {
  id: string;
  filename: string;
  fileSize: number;
  status: string;
  uploadedAt: Date;
};

type DocumentWithStatus = {
  documentType: DocumentType;
  document: UserDocument | null;
};

interface DocumentListProps {
  visaType?: string;
  onSelectDocumentType?: (documentTypeId: string, friendlyName: string) => void;
}

export function DocumentListV2({
  visaType = "student",
  onSelectDocumentType,
}: DocumentListProps) {
  // Use React Query for data fetching with automatic polling
  const { data: documents = [], isLoading: loading } = useDocuments(visaType);
  const deleteMutation = useDeleteDocument();

  const handleDelete = (documentId: string) => {
    deleteMutation.mutate(documentId);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive";
        label: string;
        icon: React.ReactNode;
        className?: string;
      }
    > = {
      processing: {
        variant: "secondary",
        label: "Processing",
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
      partitioning: {
        variant: "secondary",
        label: "Processing",
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
      indexing: {
        variant: "secondary",
        label: "Processing",
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
      ready: {
        variant: "default",
        label: "Ready",
        icon: <CheckCircle2 className="w-3 h-3" />,
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      failed: {
        variant: "destructive",
        label: "Failed",
        icon: <XCircle className="w-3 h-3" />,
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
    };

    const config = statusConfig[status] || statusConfig.processing;
    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className || ""}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const requiredDocs = documents.filter((d) => d.documentType.isRequired);
  const optionalDocs = documents.filter((d) => !d.documentType.isRequired);
  const uploadedCount = documents.filter((d) => d.document !== null).length;
  const requiredUploadedCount = requiredDocs.filter((d) => d.document !== null).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
          <CardDescription>
            {requiredUploadedCount} of {requiredDocs.length} required documents uploaded
            {optionalDocs.length > 0 && ` • ${uploadedCount - requiredUploadedCount} optional documents uploaded`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Required Documents */}
      {requiredDocs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Required Documents
          </h3>
          <div className="space-y-3">
            {requiredDocs.map((item) => (
              <DocumentCard
                key={item.documentType.id}
                item={item}
                onDelete={handleDelete}
                onUpload={onSelectDocumentType}
                isDeleting={deleteMutation.isPending}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional Documents */}
      {optionalDocs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Optional Documents
          </h3>
          <div className="space-y-3">
            {optionalDocs.map((item) => (
              <DocumentCard
                key={item.documentType.id}
                item={item}
                onDelete={handleDelete}
                onUpload={onSelectDocumentType}
                isDeleting={deleteMutation.isPending}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentCard({
  item,
  onDelete,
  onUpload,
  isDeleting,
  formatFileSize,
  formatDate,
  getStatusBadge,
}: {
  item: DocumentWithStatus;
  onDelete: (id: string) => void;
  onUpload?: (documentTypeId: string, friendlyName: string) => void;
  isDeleting: boolean;
  formatFileSize: (bytes: number) => string;
  formatDate: (date: Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  const { documentType, document } = item;
  const hasDocument = document !== null;

  return (
    <Card className={hasDocument ? "" : "border-dashed"}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              hasDocument
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {hasDocument ? (
              <FileText className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm">{documentType.friendlyName}</h3>
                  {documentType.isRequired && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                {documentType.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {documentType.description}
                  </p>
                )}

                {hasDocument ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {document.filename}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(document.uploadedAt)}</span>
                      <span>•</span>
                      {getStatusBadge(document.status)}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not uploaded yet</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {hasDocument ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpload?.(documentType.id, documentType.friendlyName)}
                      disabled={!onUpload}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Replace
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete document?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{document.filename}" from your account
                            and remove it from the knowledge base. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(document.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onUpload?.(documentType.id, documentType.friendlyName)}
                    disabled={!onUpload}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

