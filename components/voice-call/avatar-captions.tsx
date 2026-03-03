"use client";

import { useEffect, useState, useRef } from "react";
import {
  useTranscriptions,
  useRoomContext,
  type TextStreamData,
} from "@livekit/components-react";
import { cn } from "@/lib/utils";

interface Caption {
  id: string;
  text: string;
  timestamp: number;
  participantName: string;
}

export function AvatarCaptions() {
  const transcriptions: TextStreamData[] = useTranscriptions();
  const room = useRoomContext();
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!room || transcriptions.length === 0) return;

    // Get the most recent transcription
    const latestTranscription = transcriptions[transcriptions.length - 1];

    // Only show agent transcriptions (not user's own speech)
    if (
      latestTranscription.participantInfo.identity ===
      room.localParticipant.identity
    ) {
      return;
    }

    // Find the participant
    const participant = Array.from(room.remoteParticipants.values()).find(
      (p) => p.identity === latestTranscription.participantInfo.identity
    );

    if (!participant) return;

    // Create caption
    const caption: Caption = {
      id: latestTranscription.streamInfo.id,
      text: latestTranscription.text,
      timestamp: Date.now(),
      participantName: participant.name || "Interviewer",
    };

    setCurrentCaption(caption);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Auto-hide caption after 5 seconds of no new speech
    timeoutRef.current = setTimeout(() => {
      setCurrentCaption(null);
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [transcriptions, room]);

  if (!currentCaption) return null;

  return (
    <div
      className={cn(
        "fixed bottom-48 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[90%] px-4",
        "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
    >
      <div className="rounded-lg bg-black/80 backdrop-blur-md px-6 py-4 shadow-2xl border border-white/10">
        <p className="text-white text-center text-lg md:text-xl font-medium leading-relaxed">
          {currentCaption.text}
        </p>
      </div>
    </div>
  );
}

/**
 * Alternative compact version for minimal UI
 */
export function AvatarCaptionsCompact() {
  const transcriptions: TextStreamData[] = useTranscriptions();
  const room = useRoomContext();
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!room || transcriptions.length === 0) return;

    const latestTranscription = transcriptions[transcriptions.length - 1];

    // Only show agent transcriptions
    if (
      latestTranscription.participantInfo.identity ===
      room.localParticipant.identity
    ) {
      return;
    }

    const participant = Array.from(room.remoteParticipants.values()).find(
      (p) => p.identity === latestTranscription.participantInfo.identity
    );

    if (!participant) return;

    const caption: Caption = {
      id: latestTranscription.streamInfo.id,
      text: latestTranscription.text,
      timestamp: Date.now(),
      participantName: participant.name || "Interviewer",
    };

    setCurrentCaption(caption);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setCurrentCaption(null);
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [transcriptions, room]);

  if (!currentCaption) return null;

  return (
    <div
      className={cn(
        "fixed bottom-40 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[80%]",
        "animate-in fade-in slide-in-from-bottom-2 duration-200"
      )}
    >
      <div className="rounded-md bg-black/70 backdrop-blur-sm px-4 py-2 shadow-xl">
        <p className="text-white text-center text-sm md:text-base leading-snug">
          {currentCaption.text}
        </p>
      </div>
    </div>
  );
}

/**
 * Version with transcript history scrolling
 */
export function AvatarCaptionsWithHistory() {
  const transcriptions: TextStreamData[] = useTranscriptions();
  const room = useRoomContext();
  const [captions, setCaptions] = useState<Caption[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room || transcriptions.length === 0) return;

    const agentTranscriptions = transcriptions
      .filter(
        (t) =>
          t.participantInfo.identity !== room.localParticipant.identity &&
          t.text.trim().length > 0
      )
      .map((t) => {
        const participant = Array.from(room.remoteParticipants.values()).find(
          (p) => p.identity === t.participantInfo.identity
        );

        return {
          id: t.streamInfo.id,
          text: t.text,
          timestamp: t.streamInfo.timestamp,
          participantName: participant?.name || "Interviewer",
        };
      });

    // Keep only last 5 captions
    setCaptions(agentTranscriptions.slice(-5));

    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions, room]);

  if (captions.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-48 left-1/2 -translate-x-1/2 z-40 max-w-3xl w-[85%]",
        "max-h-48 overflow-y-auto",
        "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
      ref={scrollRef}
    >
      <div className="space-y-2">
        {captions.map((caption, index) => (
          <div
            key={caption.id}
            className={cn(
              "rounded-lg bg-black/80 backdrop-blur-md px-4 py-3 shadow-xl border border-white/10",
              "transition-opacity duration-300",
              index === captions.length - 1 ? "opacity-100" : "opacity-60"
            )}
          >
            <p className="text-white text-sm md:text-base leading-relaxed">
              {caption.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
