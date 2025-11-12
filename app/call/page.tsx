"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CallInterface } from "@/components/voice-call/call-interface";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { useInterview } from "@/lib/contexts/interview-context";
import { buildAgentConfig } from "@/lib/agent-config-builder";
import type { LiveKitConfig } from "@/lib/types/livekit";

export default function CallPage() {
  const router = useRouter();
  const { configuration } = useInterview();
  const { user } = useUser();

  // Redirect if no visa type is selected
  useEffect(() => {
    if (!configuration.visaType) {
      router.push("/select-visa");
    }
  }, [configuration.visaType, router]);

  // Build agent configuration from interview context
  const agentConfig = useMemo(() => {
    if (!configuration.visaType || !user) return undefined;

    try {
      return buildAgentConfig(configuration, {
        name: user.firstName || user.emailAddresses[0]?.emailAddress || "User",
        userId: user.id,
      });
    } catch (error) {
      console.error("Failed to build agent config:", error);
      return undefined;
    }
  }, [configuration, user]);

  if (!configuration.visaType || !agentConfig) {
    return null;
  }

  const config: LiveKitConfig = {
    pageTitle: "Vysa - Interview Session",
    supportsChatInput: false, // Chat disabled for interview experience
    supportsVideoInput: false,
    supportsScreenShare: false,
    isPreConnectBufferEnabled: true,
    agentName: "CA_o2EaHmp4UmTc", // Interview agent ID - ensures correct agent joins
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <CallInterface config={config} agentConfig={agentConfig} />
      <Toaster />
    </div>
  );
}
