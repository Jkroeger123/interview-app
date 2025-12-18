"use client";

import { useState } from "react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { endInterviewByRoomName } from "@/server/interview-actions";
import { toast } from "sonner";

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
  const [isEnding, setIsEnding] = useState(false);

  const toggleMicrophone = async () => {
    await room.localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCamera = () => {
    onCameraVisibilityChange(!cameraVisible);
  };

  const handleDisconnect = async () => {
    if (isEnding) return;
    
    setIsEnding(true);
    console.log("🔴 User initiated disconnect");

    try {
      // Step 1: Signal the agent to end the interview gracefully
      const encoder = new TextEncoder();
      const data = encoder.encode(
        JSON.stringify({
          type: "end_interview",
          reason: "user_ended",
        })
      );

      try {
        await room.localParticipant.publishData(data, { reliable: true });
        console.log("✅ Sent end_interview signal to agent");
        
        // Give agent a moment to process and leave gracefully
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("❌ Failed to signal agent:", error);
        // Continue with disconnect anyway
      }

      // Step 2: Update interview status in database
      if (room.name) {
        console.log("💾 Updating interview status for room:", room.name);
        const result = await endInterviewByRoomName(room.name, "user");
        
        if (result.success) {
          console.log("✅ Interview status updated (ended by user)");
        } else {
          console.error("❌ Failed to update interview status:", result.error);
        }
      }

      // Step 3: Disconnect from room
      console.log("🔌 Disconnecting from room");
      room.disconnect();
      
      toast.success("Interview ended");
    } catch (error) {
      console.error("❌ Error during disconnect:", error);
      // Force disconnect even if there's an error
      room.disconnect();
    }
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
          disabled={isEnding}
          title="End interview"
        >
          <PhoneOff className="size-6" />
        </Button>
      </div>
    </Card>
  );
}
