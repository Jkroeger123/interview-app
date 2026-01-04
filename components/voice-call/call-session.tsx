"use client";

import { useEffect, useState } from "react";
import {
  useRoomContext,
  useVoiceAssistant,
  type AgentState,
} from "@livekit/components-react";
import { cn } from "@/lib/utils";
import { CallControlBar } from "./call-control-bar";
import { AvatarDisplay } from "./avatar-display";
import { AgentStateIndicator } from "./agent-state-indicator";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

interface CallSessionProps {
  config: any;
  disabled: boolean;
  sessionStarted: boolean;
}

function isAgentAvailable(agentState: AgentState) {
  return (
    agentState === "listening" ||
    agentState === "thinking" ||
    agentState === "speaking"
  );
}

export function CallSession({
  config,
  disabled,
  sessionStarted,
}: CallSessionProps) {
  const { state: agentState } = useVoiceAssistant();
  const room = useRoomContext();
  const [interviewerJoined, setInterviewerJoined] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === "connecting"
              ? "Interviewer did not join the room. "
              : "Interviewer connected but did not complete initializing. ";

          toast.error("Interview session ended", {
            description: reason + "Please try again.",
          });
          room.disconnect();
        }
      }, 20_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  // Track interview start time
  useEffect(() => {
    if (sessionStarted && interviewerJoined && !startTime) {
      setStartTime(Date.now());
    }
  }, [sessionStarted, interviewerJoined, startTime]);

  // Send time updates to agent every minute
  useEffect(() => {
    if (!startTime || !room || room.state !== "connected") {
      return;
    }

    const sendTimeUpdate = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const encoder = new TextEncoder();
      const data = encoder.encode(
        JSON.stringify({
          type: "time_update",
          elapsed: elapsedSeconds,
        })
      );

      try {
        room.localParticipant.publishData(data, { reliable: true });
      } catch (error) {
        console.error("Failed to send time update:", error);
      }
    };

    // Send initial update
    sendTimeUpdate();

    // Send updates every minute
    const interval = setInterval(sendTimeUpdate, 60_000);

    return () => clearInterval(interval);
  }, [startTime, room]);

  // Handle when video is actually ready
  const handleVideoReady = () => {
    if (!interviewerJoined) {
      setInterviewerJoined(true);
      toast.success("Interviewer has joined");
    }
  };

  return (
    <section
      className={cn(
        "fixed inset-x-0 top-16 bottom-0 z-10 transition-opacity duration-500",
        disabled ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <AvatarDisplay
        sessionStarted={sessionStarted}
        onVideoReady={handleVideoReady}
        cameraVisible={cameraVisible}
      />

      {/* Status overlay */}
      {sessionStarted && !interviewerJoined && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-lg bg-background p-8 shadow-2xl text-center max-w-md">
            <Loader2 className="mx-auto size-12 text-blue-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Waiting for Interviewer
            </h2>
            <p className="text-sm text-muted-foreground">
              The visa officer will join shortly. Please ensure your microphone
              is working.
            </p>
          </div>
        </div>
      )}

      {/* Interview status indicator */}
      {sessionStarted && interviewerJoined && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30">
          <div className="flex flex-col items-center gap-3">
            {/* Interview In Progress Badge */}
            <div className="flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-2 backdrop-blur-sm">
              <CheckCircle2 className="size-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Interview In Progress
              </span>
            </div>
            {/* Agent State Indicator */}
            <AgentStateIndicator />
          </div>
        </div>
      )}

      <div className="fixed right-0 bottom-0 left-0 z-50 bg-background px-4 pt-4 pb-6 md:px-12 md:pb-12">
        <div className="mx-auto w-full max-w-2xl">
          <CallControlBar
            cameraVisible={cameraVisible}
            onCameraVisibilityChange={setCameraVisible}
          />
        </div>
      </div>
    </section>
  );
}
