import { CallInterface } from "@/components/voice-call/call-interface";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import type { LiveKitConfig } from "@/lib/types/livekit";

const config: LiveKitConfig = {
  pageTitle: "U.S. Visa Interview Simulator",
  supportsChatInput: false, // Chat disabled for interview experience
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,
  agentName: undefined, // Optional: specify agent name from your LiveKit agent
};

export default function CallPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <CallInterface config={config} />
      <Toaster />
    </div>
  );
}
