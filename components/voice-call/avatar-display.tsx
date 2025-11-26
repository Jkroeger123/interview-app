"use client";

import { useEffect, useState, useRef } from "react";
import {
  useVoiceAssistant,
  VideoTrack,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AvatarDisplayProps {
  sessionStarted: boolean;
  onVideoReady?: () => void;
  cameraVisible?: boolean;
}

export function AvatarDisplay({
  sessionStarted,
  onVideoReady,
  cameraVisible = true,
}: AvatarDisplayProps) {
  const { videoTrack, agent, state: agentState } = useVoiceAssistant();
  const localParticipant = useLocalParticipant();
  const room = useRoomContext();
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [agentHasLeft, setAgentHasLeft] = useState(false);
  const videoReadyRef = useRef(false);
  
  // Debug logging
  useEffect(() => {
    console.log("🎥 AvatarDisplay state:", {
      sessionStarted,
      hasVideoTrack: !!videoTrack,
      hasAgent: !!agent,
      agentState,
      videoPlaying,
    });
  }, [sessionStarted, videoTrack, agent, agentState, videoPlaying]);

  // Enable camera when session starts
  useEffect(() => {
    if (sessionStarted && localParticipant.localParticipant) {
      const enableCamera = async () => {
        try {
          await localParticipant.localParticipant.setCameraEnabled(true);
        } catch (error) {
          console.error("Failed to enable camera:", error);
        }
      };
      enableCamera();
    }
  }, [sessionStarted, localParticipant.localParticipant]);

  // Fallback: Detect agent by state instead of waiting for videoTrack
  // If agent is speaking/listening, they've joined successfully
  useEffect(() => {
    if (!videoReadyRef.current && agentState && agentState !== "disconnected" && agentState !== "connecting") {
      console.log("🎤 Agent detected via agentState (no video):", agentState);
      const timer = setTimeout(() => {
        setVideoPlaying(true);
        videoReadyRef.current = true;
        onVideoReady?.();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [agentState, onVideoReady]);

  // Additional fallback: Check for remote participants (agent joined)
  // Poll multiple times as agent might join after session starts
  useEffect(() => {
    if (!videoReadyRef.current && sessionStarted && room) {
      let attempts = 0;
      const maxAttempts = 10; // Check for 10 seconds
      
      const checkInterval = setInterval(() => {
        const remoteParticipants = Array.from(room.remoteParticipants.values());
        attempts++;
        
        console.log(`🔍 [Attempt ${attempts}/${maxAttempts}] Checking remote participants:`, remoteParticipants.length);
        
        if (remoteParticipants.length > 0) {
          console.log("✅ Remote participant detected (agent):", remoteParticipants[0].identity);
          clearInterval(checkInterval);
          setVideoPlaying(true);
          videoReadyRef.current = true;
          onVideoReady?.();
        } else if (attempts >= maxAttempts) {
          console.warn("⚠️ No remote participants found after polling");
          clearInterval(checkInterval);
        }
      }, 1000); // Check every second
      
      return () => clearInterval(checkInterval);
    }
  }, [sessionStarted, room, onVideoReady]);

  // Detect when video actually starts playing
  useEffect(() => {
    if (videoTrack && !videoReadyRef.current) {
      // Minimal delay to ensure video is actually rendering
      const timer = setTimeout(() => {
        setVideoPlaying(true);
        videoReadyRef.current = true;
        onVideoReady?.();
      }, 100); // Very short delay just to ensure video element is ready

      return () => clearTimeout(timer);
    }
  }, [videoTrack, onVideoReady]);

  // Detect when agent leaves after having joined
  useEffect(() => {
    if (videoPlaying && !videoTrack && !agent) {
      // Agent was there, now they're gone
      setAgentHasLeft(true);
    }
  }, [videoTrack, agent, videoPlaying]);

  if (!sessionStarted) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-0 flex items-center justify-center bg-gradient-to-b from-background to-secondary">
      <Card
        className={cn(
          "relative overflow-hidden shadow-2xl transition-all duration-500",
          videoTrack ? "w-[90vw] max-w-4xl aspect-video" : "w-64 h-64"
        )}
      >
        {videoTrack ? (
          <>
            <VideoTrack
              trackRef={videoTrack}
              className="w-full h-full object-cover"
            />

            {/* User's camera feed - Picture in Picture */}
            {localParticipant.cameraTrack && cameraVisible && (
              <div className="absolute bottom-4 right-4 w-24 sm:w-32 md:w-40 lg:w-48 aspect-video rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 transition-opacity duration-300">
                <VideoTrack
                  trackRef={{
                    participant: localParticipant.localParticipant,
                    publication: localParticipant.cameraTrack,
                    source: localParticipant.cameraTrack.source,
                  }}
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 rounded bg-black/50 px-1.5 py-0.5 sm:px-2 sm:py-1 backdrop-blur-sm">
                  <p className="text-[10px] sm:text-xs font-medium text-white">
                    You
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-muted">
            {agentHasLeft ? (
              <div className="text-center px-8">
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  The interviewer has left the call
                </p>
                <p className="text-sm text-muted-foreground">
                  Feel free to hang up now
                </p>
              </div>
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
                <div className="size-16 rounded-full bg-primary/20 animate-pulse" />
              </div>
            )}
          </div>
        )}

        {agent && videoPlaying && (
          <div className="absolute bottom-4 left-4 rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm">
            <p className="text-sm font-medium text-white">Visa Officer</p>
          </div>
        )}
      </Card>
    </div>
  );
}
