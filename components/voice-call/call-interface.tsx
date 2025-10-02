"use client";

import { useEffect, useMemo, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import {
  RoomAudioRenderer,
  RoomContext,
  StartAudio,
} from "@livekit/components-react";
import { useConnectionDetails } from "@/hooks/use-connection-details";
import type { LiveKitConfig } from "@/lib/types/livekit";
import { CallWelcome } from "./call-welcome";
import { CallSession } from "./call-session";
import { toast } from "sonner";

interface CallInterfaceProps {
  config: LiveKitConfig;
}

export function CallInterface({ config }: CallInterfaceProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const { refreshConnectionDetails, existingOrRefreshConnectionDetails } =
    useConnectionDetails(config);

  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      refreshConnectionDetails();
    };
    const onMediaDevicesError = (error: Error) => {
      toast.error("Media Device Error", {
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails]);

  useEffect(() => {
    let aborted = false;
    if (sessionStarted && room.state === "disconnected") {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: config.isPreConnectBufferEnabled,
        }),
        existingOrRefreshConnectionDetails().then((connectionDetails) =>
          room.connect(
            connectionDetails.serverUrl,
            connectionDetails.participantToken
          )
        ),
      ]).catch((error) => {
        if (aborted) {
          return;
        }

        toast.error("Connection Error", {
          description: `${error.name}: ${error.message}`,
        });
      });
    }
    return () => {
      aborted = true;
      room.disconnect();
    };
  }, [
    room,
    sessionStarted,
    config.isPreConnectBufferEnabled,
    existingOrRefreshConnectionDetails,
  ]);

  return (
    <main className="relative min-h-screen">
      <CallWelcome
        onStartCall={() => setSessionStarted(true)}
        disabled={sessionStarted}
      />

      <RoomContext.Provider value={room}>
        <RoomAudioRenderer />
        <StartAudio label="Start Audio" />

        <CallSession
          config={config}
          disabled={!sessionStarted}
          sessionStarted={sessionStarted}
        />
      </RoomContext.Provider>
    </main>
  );
}
