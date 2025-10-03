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
  agentName: "CA_o2EaHmp4UmTc", // Interview agent ID - ensures correct agent joins
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
