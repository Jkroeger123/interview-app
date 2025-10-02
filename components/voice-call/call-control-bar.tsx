"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CallControlBarProps {
  cameraVisible: boolean;
  onCameraVisibilityChange: (visible: boolean) => void;
}

export function CallControlBar({
  cameraVisible,
  onCameraVisibilityChange,
}: CallControlBarProps) {
  const room = useRoomContext();
  const { isMicrophoneEnabled } = useLocalParticipant();

  const toggleMicrophone = async () => {
    await room.localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCamera = () => {
    onCameraVisibilityChange(!cameraVisible);
  };

  const handleDisconnect = () => {
    room.disconnect();
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={isMicrophoneEnabled ? "default" : "destructive"}
          size="icon"
          className="size-14 rounded-full"
          onClick={toggleMicrophone}
          title={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicrophoneEnabled ? (
            <Mic className="size-6" />
          ) : (
            <MicOff className="size-6" />
          )}
        </Button>

        <Button
          variant={cameraVisible ? "default" : "outline"}
          size="icon"
          className="size-14 rounded-full"
          onClick={toggleCamera}
          title={cameraVisible ? "Hide camera" : "Show camera"}
        >
          {cameraVisible ? (
            <Video className="size-6" />
          ) : (
            <VideoOff className="size-6" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="size-14 rounded-full"
          onClick={handleDisconnect}
          title="End interview"
        >
          <PhoneOff className="size-6" />
        </Button>
      </div>
    </Card>
  );
}
