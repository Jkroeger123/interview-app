"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Room, RoomEvent } from "livekit-client";
import {
  RoomAudioRenderer,
  RoomContext,
  StartAudio,
} from "@livekit/components-react";
import { useConnectionDetails } from "@/hooks/use-connection-details";
import type { LiveKitConfig } from "@/lib/types/livekit";
import type { AgentConfig } from "@/lib/agent-config-builder";
import { CallWelcome } from "./call-welcome";
import { CallSession } from "./call-session";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { interviewErrors, interviewEvents } from "@/lib/posthog-errors";

interface CallInterfaceProps {
  config: LiveKitConfig;
  agentConfig?: AgentConfig;
  onDisconnect?: () => void; // Callback when disconnected (for routing back home)
  showWelcome?: boolean; // Show welcome screen with "Join" button
}

export interface CallInterfaceHandle {
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const CallInterface = forwardRef<
  CallInterfaceHandle,
  CallInterfaceProps
>(function CallInterface(
  { config, agentConfig, onDisconnect, showWelcome = false },
  ref
) {
  // Use refs to avoid stale closures and unnecessary re-renders
  const roomRef = useRef(new Room());
  const hasConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const mountTimeRef = useRef(Date.now());

  const [isConnected, setIsConnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const { existingOrRefreshConnectionDetails } = useConnectionDetails(
    config,
    agentConfig
  );

  console.log("🔵 RENDER: CallInterface", {
    showWelcome,
    connectionFailed,
    isConnected,
    roomState: roomRef.current.state,
    mountAge: Date.now() - mountTimeRef.current,
  });

  // Handle browser close/refresh - signal agent before leaving
  useEffect(() => {
    const room = roomRef.current;

    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      // Only signal if we're connected
      if (room.state === "connected") {
        console.log("🔴 Browser closing - signaling agent to leave");

        try {
          // Send end_interview signal to agent
          const encoder = new TextEncoder();
          const data = encoder.encode(
            JSON.stringify({
              type: "end_interview",
              reason: "browser_closed",
            })
          );

          // Use sendBeacon as a best-effort attempt (works even as page unloads)
          await room.localParticipant.publishData(data, { reliable: false });

          // Small delay to allow message to send
          // Note: This may not complete before browser closes, but we try
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error("❌ Failed to signal agent on close:", error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Setup room event listeners ONCE (reactive - belongs in useEffect)
  useEffect(() => {
    const room = roomRef.current;

    console.log("🟢 EFFECT: Setting up room event listeners (ONCE)", {
      roomState: room.state,
      hasOnDisconnect: !!onDisconnect,
    });

    const onConnected = () => {
      console.log("🟢 CONNECTED:", {
        roomState: room.state,
        roomName: room.name,
        mountAge: Date.now() - mountTimeRef.current,
      });
      setIsConnected(true);
      setConnectionFailed(false);
      hasConnectedRef.current = true;
    };

    const onReconnecting = () => {
      console.log("🟡 RECONNECTING:", {
        roomState: room.state,
        mountAge: Date.now() - mountTimeRef.current,
      });
    };

    const onDisconnected = (reason?: any) => {
      console.log("🔴 DISCONNECTED:", {
        reason,
        roomState: room.state,
        hasOnDisconnect: !!onDisconnect,
        mountAge: Date.now() - mountTimeRef.current,
      });

      setIsConnected(false);
      isConnectingRef.current = false;

      // Track disconnection if it wasn't user-initiated
      const reasonStr = typeof reason === 'string' ? reason : reason?.reason || 'unknown';
      if (reasonStr !== 'user_initiated' && reasonStr !== 'browser_closed') {
        interviewErrors.unexpectedDisconnect({
          reason: reasonStr,
          roomName: room.name,
          elapsedTimeMs: Date.now() - mountTimeRef.current,
        });
      } else {
        // Track normal user disconnect
        interviewEvents.userDisconnected({ reason: reasonStr });
      }

      // Call the onDisconnect callback if provided (for routing to completion page)
      if (onDisconnect) {
        console.log("🔴 Calling onDisconnect callback (routing to completion)");
        onDisconnect();
      } else {
        console.log("🔴 No callback, showing reconnect UI");
        setConnectionFailed(true);
      }
    };

    const onMediaDevicesError = (error: Error) => {
      console.error("❌ MEDIA DEVICES ERROR:", error);
      
      // Track media device error in PostHog
      interviewErrors.mediaDeviceError({
        error,
        deviceType: error.message.toLowerCase().includes('microphone') 
          ? 'microphone' 
          : error.message.toLowerCase().includes('camera') 
            ? 'camera' 
            : 'unknown',
        roomName: room.name,
      });
      
      toast.error("Media Device Error", {
        description: `${error.name}: ${error.message}`,
      });
    };

    const onTrackSubscribed = (
      track: any,
      publication: any,
      participant: any
    ) => {
      console.log("🎵 TRACK SUBSCRIBED:", {
        trackKind: track.kind,
        trackSource: track.source,
        trackSourceName: publication.source,
        participantIdentity: participant.identity,
        trackSid: track.sid,
        publicationSid: publication.trackSid,
        isMuted: track.isMuted,
        volume: track.volume,
      });

      // Log details for agent tracks (audio and video)
      if (participant.identity.includes("agent")) {
        if (track.kind === "audio") {
          console.log("🔊 AGENT AUDIO TRACK DETAILS:", {
            mediaStreamTrack: track.mediaStreamTrack,
            enabled: track.mediaStreamTrack?.enabled,
            muted: track.mediaStreamTrack?.muted,
            readyState: track.mediaStreamTrack?.readyState,
            settings: track.mediaStreamTrack?.getSettings?.(),
          });
        } else if (track.kind === "video") {
          console.log("🎥 AGENT VIDEO TRACK DETAILS:", {
            mediaStreamTrack: track.mediaStreamTrack,
            enabled: track.mediaStreamTrack?.enabled,
            muted: track.mediaStreamTrack?.muted,
            readyState: track.mediaStreamTrack?.readyState,
            settings: track.mediaStreamTrack?.getSettings?.(),
            dimensions: {
              width: track.dimensions?.width,
              height: track.dimensions?.height,
            },
          });
        }
      }
    };

    const onTrackUnsubscribed = (
      track: any,
      publication: any,
      participant: any
    ) => {
      console.log("🔇 TRACK UNSUBSCRIBED:", {
        trackKind: track.kind,
        participantIdentity: participant.identity,
      });
    };

    const onParticipantConnected = (participant: any) => {
      console.log("👤 PARTICIPANT JOINED:", {
        identity: participant.identity,
        sid: participant.sid,
        name: participant.name,
        metadata: participant.metadata,
        trackCount: participant.trackPublications?.size || 0,
      });

      // Log all tracks this participant has
      if (participant.trackPublications) {
        participant.trackPublications.forEach((pub: any) => {
          console.log("  📌 Track publication:", {
            kind: pub.kind,
            source: pub.source,
            trackSid: pub.trackSid,
            subscribed: pub.isSubscribed,
          });
        });
      }
    };

    const onParticipantDisconnected = (participant: any) => {
      console.log("👋 PARTICIPANT LEFT:", {
        identity: participant.identity,
        sid: participant.sid,
      });

      // Check if the agent/interviewer left
      const isAgent = participant.identity.toLowerCase().includes("agent");
      
      if (isAgent) {
        console.log("🎤 Agent left the interview - ending session");
        
        // Track interview completion
        interviewEvents.completed({
          roomName: room.name,
          durationMs: Date.now() - mountTimeRef.current,
        });

        toast.success("Interview Complete", {
          description: "The interviewer has ended the session.",
        });

        // Small delay to let the toast show, then disconnect
        setTimeout(() => {
          room.disconnect();
        }, 500);
      }
    };

    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);

    return () => {
      console.log(
        "🔴 CLEANUP: Component unmounting, removing event listeners",
        {
          roomState: room.state,
          isConnecting: isConnectingRef.current,
          mountAge: Date.now() - mountTimeRef.current,
        }
      );
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);

      // Only disconnect if we're actually connected AND not in the middle of connecting
      // (Strict Mode test unmounts/remounts, we don't want to kill active connections)
      if (room.state === "connected") {
        console.log("🔴 CLEANUP: Disconnecting room on real unmount");
        room.disconnect();
      } else if (room.state === "connecting" && !isConnectingRef.current) {
        // Only disconnect if connecting state is stale (not actively connecting)
        console.log("🔴 CLEANUP: Disconnecting stale connection");
        room.disconnect();
      } else {
        console.log(
          "🔵 CLEANUP: Skipping disconnect (state:",
          room.state,
          ", connecting:",
          isConnectingRef.current,
          ")"
        );
      }
    };
  }, []); // Empty deps - runs once on mount, cleanup on unmount

  // Explicit connection function (imperative - called by parent or button)
  const connectToRoom = useCallback(async () => {
    const room = roomRef.current;

    // Guard against double-connection
    if (
      isConnectingRef.current ||
      room.state === "connected" ||
      room.state === "connecting"
    ) {
      console.log("⚠️ Already connected/connecting, ignoring request");
      return;
    }

    console.log("🟢 CONNECTING: Starting connection sequence (explicit call)", {
      roomState: room.state,
      mountAge: Date.now() - mountTimeRef.current,
    });

    isConnectingRef.current = true;
    hasConnectedRef.current = true;
    setConnectionFailed(false);

    try {
      // Step 1: Get connection details
      const connectionDetails = await existingOrRefreshConnectionDetails();
      console.log("🔑 Got connection details:", {
        serverUrl: connectionDetails.serverUrl,
        roomName: connectionDetails.roomName,
        mountAge: Date.now() - mountTimeRef.current,
      });

      // Step 2: Connect to room FIRST
      await room.connect(
        connectionDetails.serverUrl,
        connectionDetails.participantToken
      );
      console.log("🔌 Connected to room");

      // Step 3: Enable microphone AFTER connected
      await room.localParticipant.setMicrophoneEnabled(true);
      console.log("🎤 Microphone enabled");

      // Track interview started
      interviewEvents.started({
        roomName: connectionDetails.roomName,
      });

      console.log("✅ Connection sequence completed successfully");
    } catch (error: any) {
      console.error("❌ CONNECTION ERROR:", {
        error,
        name: error?.name,
        message: error?.message,
        mountAge: Date.now() - mountTimeRef.current,
      });

      // Track connection error in PostHog
      interviewErrors.connectionFailed({
        error: error instanceof Error ? error : new Error(error?.message || 'Unknown error'),
        roomName: roomRef.current.name,
      });

      toast.error("Connection Error", {
        description: `${error?.name || "Error"}: ${
          error?.message || "Unknown error"
        }`,
      });

      setConnectionFailed(true);
    } finally {
      isConnectingRef.current = false;
      console.log("🏁 Connection sequence finished");
    }
  }, [existingOrRefreshConnectionDetails]);

  const disconnectFromRoom = useCallback(() => {
    const room = roomRef.current;
    console.log("🔴 Explicit disconnect requested");
    if (room.state === "connected" || room.state === "connecting") {
      room.disconnect();
    }
  }, []);

  // Expose connect/disconnect functions to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      connect: connectToRoom,
      disconnect: disconnectFromRoom,
    }),
    [connectToRoom, disconnectFromRoom]
  );

  const handleRetry = () => {
    console.log("🔄 Retry button clicked");
    setConnectionFailed(false);
    connectToRoom();
  };

  return (
    <main className="relative min-h-screen">
      {showWelcome && (
        <CallWelcome
          onStartCall={connectToRoom}
          disabled={isConnectingRef.current || isConnected}
        />
      )}

      {/* Show retry button when connection failed */}
      {connectionFailed && !showWelcome && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-background">
          <div className="text-center">
            <p className="mb-4 text-lg text-muted-foreground">
              Connection ended or failed to start
            </p>
            <Button
              onClick={handleRetry}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isConnectingRef.current}
            >
              {isConnectingRef.current
                ? "Connecting..."
                : "Reconnect to Interview"}
            </Button>
          </div>
        </div>
      )}

      <RoomContext.Provider value={roomRef.current}>
        <RoomAudioRenderer />

        {/* Start Audio button - MUST be clicked for browser autoplay policy */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]">
          <StartAudio label="🔊 Click Here to Enable Audio" />
        </div>

        <CallSession
          config={config}
          disabled={!isConnected}
          sessionStarted={isConnected}
        />
      </RoomContext.Provider>
    </main>
  );
});
