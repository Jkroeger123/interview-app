"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VideoPlayerProps {
  recordingUrl?: string;
  recordingStatus: string;
}

export function VideoPlayer({ recordingUrl, recordingStatus }: VideoPlayerProps) {
  if (recordingStatus === "pending" || recordingStatus === "recording") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Recording in progress...</p>
          <p className="text-sm text-muted-foreground">
            Your interview is being recorded. The video will be available shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (recordingStatus === "processing") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Processing recording...</p>
          <p className="text-sm text-muted-foreground">
            Your interview has been recorded and is being processed. This usually takes a few
            minutes.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (recordingStatus === "failed" || !recordingUrl) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-destructive/10 p-3 mb-4">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">Recording unavailable</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {recordingStatus === "failed"
              ? "There was an error recording your interview. The transcript and analysis are still available below."
              : "The recording for this interview is not available."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Recording is ready
  return (
    <Card>
      <CardContent className="p-0">
        <video
          controls
          className="w-full rounded-lg"
          preload="metadata"
          controlsList="nodownload"
        >
          <source src={recordingUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </CardContent>
    </Card>
  );
}

