"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Calendar, Clock, Trash2 } from "lucide-react";
import { deleteInterview } from "@/server/interview-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Interview = {
  id: string;
  visaType: string;
  status: string;
  startedAt: Date;
  duration: number | null;
  report?: {
    overallScore: number;
    recommendation: string;
  } | null;
};

interface InterviewListProps {
  interviews: Interview[];
}

export function InterviewList({ interviews }: InterviewListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const getScoreBadge = (score: number | null | undefined) => {
    if (score === null || score === undefined) return null;

    const colorClass =
      score >= 80
        ? "bg-green-100 text-green-800 border-green-200"
        : score >= 60
          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
          : "bg-red-100 text-red-800 border-red-200";

    return (
      <Badge variant="outline" className={colorClass}>
        Score: {score}/100
      </Badge>
    );
  };

  const handleDeleteClick = (interviewId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    setInterviewToDelete(interviewId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!interviewToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteInterview(interviewToDelete);

      if (result.success) {
        toast.success("Interview deleted successfully");
        setDeleteDialogOpen(false);
        setInterviewToDelete(null);
        router.refresh(); // Refresh the server component data
      } else {
        toast.error(result.error || "Failed to delete interview");
      }
    } catch (error) {
      console.error("Error deleting interview:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="grid gap-4">
        {interviews.map((interview) => (
          <div key={interview.id} className="relative group">
            <Link href={`/reports/${interview.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {interview.visaType} Visa
                        </Badge>
                        <Badge
                          variant={interview.status === "completed" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {interview.status}
                        </Badge>
                        {interview.report?.overallScore !== undefined &&
                          getScoreBadge(interview.report.overallScore)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(interview.startedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(interview.duration)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {interview.report?.recommendation && (
                        <Badge
                          variant={
                            interview.report.recommendation === "approve"
                              ? "default"
                              : interview.report.recommendation === "deny"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {interview.report.recommendation === "approve"
                            ? "Likely Approval"
                            : interview.report.recommendation === "deny"
                              ? "Needs Work"
                              : "Further Review"}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteClick(interview.id, e)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this interview and all associated data including the
              recording, transcript, and AI analysis. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

