import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getUserInterviews } from "@/server/interview-actions";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";
import Link from "next/link";
import { InterviewList } from "@/components/reports/interview-list";

export default async function ReportsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const interviewsResult = await getUserInterviews();
  const interviews = interviewsResult.success ? interviewsResult.interviews || [] : [];

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
          <InterviewList interviews={interviews} />
        )}
      </div>
    </div>
  );
}

