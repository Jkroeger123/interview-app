import { notFound, redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getInterviewById } from "@/server/interview-actions";
import { getReportByInterviewId } from "@/server/report-actions";
import { Navbar } from "@/components/navbar";
import { VideoPlayer } from "@/components/reports/video-player";
import { TranscriptDisplay } from "@/components/reports/transcript-display";
import { AIAnalysisCard } from "@/components/reports/ai-analysis-card";
import { AutoRefreshWrapper } from "@/components/reports/auto-refresh-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Download } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch interview data
  const interviewResult = await getInterviewById(id);
  
  if (!interviewResult.success || !interviewResult.interview) {
    notFound();
  }

  const interview = interviewResult.interview;
  
  // Note: Expired interviews are automatically deleted, so if we reach here, the interview exists

  // Fetch report data
  const reportResult = await getReportByInterviewId(id);
  
  const hasReport = reportResult.success && reportResult.report;

  // Format date and duration
  const formattedDate = new Date(interview.startedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = new Date(interview.startedAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const durationMinutes = interview.duration ? Math.floor(interview.duration / 60) : null;

  return (
    <AutoRefreshWrapper recordingStatus={interview.recordingStatus}>
      <div className="min-h-screen bg-background">
        <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/reports">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Interview Report</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate} at {formattedTime}</span>
                </div>
                {durationMinutes !== null && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{durationMinutes} minutes</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {interview.visaType} Visa
              </Badge>
              <Badge 
                variant={interview.status === "completed" ? "default" : "secondary"}
                className="capitalize"
              >
                {interview.status}
              </Badge>
              {hasReport && (
                <Link href={`/api/reports/${id}/pdf`} target="_blank">
                  <Button variant="default" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="mb-8">
          <VideoPlayer
            recordingUrl={interview.recordingUrl || undefined}
            recordingStatus={interview.recordingStatus}
          />
        </div>

        {/* AI Analysis */}
        {hasReport ? (
          <div className="mb-8">
            <AIAnalysisCard analysis={reportResult.report} />
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                {interview.status === "completed"
                  ? "Generating your personalized feedback report..."
                  : "AI analysis will be generated once the interview is completed"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interview.status === "completed" ? (
                <div className="text-center py-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    This usually takes 1-2 minutes
                  </p>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Complete your interview to receive AI-powered feedback
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transcript */}
        {interview.transcriptSegments && interview.transcriptSegments.length > 0 ? (
          <div className="mb-8">
            <TranscriptDisplay segments={interview.transcriptSegments} />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
              <CardDescription>
                {interview.status === "completed"
                  ? "Processing interview transcript..."
                  : "Transcript will be available once the interview is completed"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-4">
                No transcript available yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </AutoRefreshWrapper>
  );
}

