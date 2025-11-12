"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
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

export const CallInterface = forwardRef<CallInterfaceHandle, CallInterfaceProps>(
  function CallInterface({ config, agentConfig, onDisconnect, showWelcome = false }, ref) {
    // Use refs to avoid stale closures and unnecessary re-renders
    const roomRef = useRef(new Room());
    const hasConnectedRef = useRef(false);
    const isConnectingRef = useRef(false);
    const mountTimeRef = useRef(Date.now());
    
    const [isConnected, setIsConnected] = useState(false);
    const [connectionFailed, setConnectionFailed] = useState(false);
    const { existingOrRefreshConnectionDetails } = useConnectionDetails(config, agentConfig);

    console.log("🔵 RENDER: CallInterface", {
      showWelcome,
      connectionFailed,
      isConnected,
      roomState: roomRef.current.state,
      mountAge: Date.now() - mountTimeRef.current,
    });

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
      toast.error("Media Device Error", {
        description: `${error.name}: ${error.message}`,
      });
    };

    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);

    return () => {
      console.log("🔴 CLEANUP: Component unmounting, removing event listeners", {
        roomState: room.state,
        isConnecting: isConnectingRef.current,
        mountAge: Date.now() - mountTimeRef.current,
      });
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
      
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
        console.log("🔵 CLEANUP: Skipping disconnect (state:", room.state, ", connecting:", isConnectingRef.current, ")");
      }
    };
  }, []); // Empty deps - runs once on mount, cleanup on unmount

  // Explicit connection function (imperative - called by parent or button)
    const connectToRoom = useCallback(async () => {
      const room = roomRef.current;
      
      // Guard against double-connection
      if (isConnectingRef.current || room.state === "connected" || room.state === "connecting") {
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
        
        console.log("✅ Connection sequence completed successfully");
      } catch (error: any) {
        console.error("❌ CONNECTION ERROR:", {
          error,
          name: error?.name,
          message: error?.message,
          mountAge: Date.now() - mountTimeRef.current,
        });

        toast.error("Connection Error", {
          description: `${error?.name || 'Error'}: ${error?.message || 'Unknown error'}`,
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
    useImperativeHandle(ref, () => ({
      connect: connectToRoom,
      disconnect: disconnectFromRoom,
    }), [connectToRoom, disconnectFromRoom]);

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
                {isConnectingRef.current ? "Connecting..." : "Reconnect to Interview"}
              </Button>
            </div>
          </div>
        )}

        <RoomContext.Provider value={roomRef.current}>
          <RoomAudioRenderer />
          <StartAudio label="Start Audio" />

          <CallSession
            config={config}
            disabled={!isConnected}
            sessionStarted={isConnected}
          />
        </RoomContext.Provider>
      </main>
    );
  }
);
