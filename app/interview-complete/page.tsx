"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function InterviewCompletePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          router.push("/reports");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [router]);

  const handleViewReports = () => {
    router.push("/reports");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          {/* Success Icon */}
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 mb-6">
            <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>

          {/* Main Message */}
          <h1 className="text-2xl font-bold mb-2 text-center">
            Interview Complete!
          </h1>
          
          <p className="text-muted-foreground text-center mb-6">
            Your interview has been successfully recorded. We're generating your performance report.
          </p>

          {/* Countdown */}
          <p className="text-sm text-muted-foreground mb-6">
            Redirecting to your interview history in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>

          {/* Action Button */}
          <Button 
            onClick={handleViewReports}
            size="lg"
            className="w-full"
          >
            View Interview History Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
