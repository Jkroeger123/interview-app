"use client";

import { useEffect, useState, useRef } from "react";
import {
  useVoiceAssistant,
  VideoTrack,
  useLocalParticipant,
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
  const { videoTrack, agent } = useVoiceAssistant();
  const localParticipant = useLocalParticipant();
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoReadyRef = useRef(false);

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
              <div className="absolute bottom-4 right-4 w-48 aspect-video rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 transition-opacity duration-300">
                <VideoTrack
                  trackRef={{
                    participant: localParticipant.localParticipant,
                    publication: localParticipant.cameraTrack,
                    source: localParticipant.cameraTrack.source,
                  }}
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 backdrop-blur-sm">
                  <p className="text-xs font-medium text-white">You</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-muted">
            <div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
              <div className="size-16 rounded-full bg-primary/20 animate-pulse" />
            </div>
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
