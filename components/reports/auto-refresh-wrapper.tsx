"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshWrapperProps {
  recordingStatus: string;
  children: React.ReactNode;
}

export function AutoRefreshWrapper({
  recordingStatus,
  children,
}: AutoRefreshWrapperProps) {
  const router = useRouter();

  useEffect(() => {
    // Auto-refresh every 5 seconds if recording is in progress
    if (
      recordingStatus === "pending" ||
      recordingStatus === "recording" ||
      recordingStatus === "processing"
    ) {
      const interval = setInterval(() => {
        console.log("🔄 Auto-refreshing report page (recording in progress)...");
        router.refresh();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [recordingStatus, router]);

  return <>{children}</>;
}

