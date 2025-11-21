import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getUserInterviews } from "@/server/interview-actions";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video } from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const interviewsResult = await getUserInterviews();
  const interviews = interviewsResult.success ? interviewsResult.interviews || [] : [];

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Interview History</h1>
          <p className="text-muted-foreground">
            View your past interviews and performance reports
          </p>
        </div>

        {interviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No interviews yet</h2>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Start your first practice interview to get AI-powered feedback and improve your visa
                interview skills.
              </p>
              <Link
                href="/select-visa"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Start New Interview
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {interviews.map((interview) => (
              <Link key={interview.id} href={`/reports/${interview.id}`}>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

