"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useInterview } from "@/lib/contexts/interview-context";
import { VISA_TYPES, INTERVIEW_DURATIONS } from "@/lib/visa-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Building2, Clock, FileText, Target, ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildAgentConfig } from "@/lib/agent-config-builder";
import { CallInterface, type CallInterfaceHandle } from "@/components/voice-call/call-interface";
import { Toaster } from "@/components/ui/sonner";
import type { LiveKitConfig } from "@/lib/types/livekit";
import { useDocumentCounts } from "@/lib/hooks/use-documents";

export default function InterviewReadyPage() {
  const router = useRouter();
  const { configuration } = useInterview();
  const { user } = useUser();
  const [interviewStarted, setInterviewStarted] = useState(false);
  const callInterfaceRef = useRef<CallInterfaceHandle>(null);
  
  // Use React Query hook for document counts
  const documentCount = useDocumentCounts(configuration.visaType || "student");

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

  if (!configuration.visaType) {
    return null;
  }

  const visaType = VISA_TYPES[configuration.visaType];
  const duration = INTERVIEW_DURATIONS.find((d) => d.value === configuration.duration);

  const handleStartInterview = () => {
    console.log("🚀 Starting interview session - calling connect explicitly");
    setInterviewStarted(true);
  };

  // When interview starts, explicitly call connect
  useEffect(() => {
    if (interviewStarted && callInterfaceRef.current) {
      console.log("📞 Explicitly calling connect on CallInterface");
      callInterfaceRef.current.connect();
    }
  }, [interviewStarted]);

  const handlePrevious = () => {
    router.push("/upload-documents");
  };

  const config: LiveKitConfig = {
    pageTitle: "Vysa - Interview Session",
    supportsChatInput: false,
    supportsVideoInput: false,
    supportsScreenShare: false,
    isPreConnectBufferEnabled: true,
    agentName: "CA_o2EaHmp4UmTc",
  };

  // If interview started, show call interface (parent controls connection)
  if (interviewStarted && agentConfig) {
    console.log("📺 Rendering CallInterface (parent will call connect)");
    return (
      <div className="min-h-screen">
        <Navbar />
        <CallInterface 
          ref={callInterfaceRef}
          config={config} 
          agentConfig={agentConfig} 
          onDisconnect={() => {
            console.log("🏁 onDisconnect callback fired, routing to completion page");
            router.push("/interview-complete");
          }}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full bg-blue-600" />
        <div className="h-1 flex-1 rounded-full bg-blue-600" />
        <div className="h-1 flex-1 rounded-full bg-blue-600" />
        <div className="h-1 flex-1 rounded-full bg-blue-600" />
      </div>

      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="flex size-20 items-center justify-center rounded-full bg-blue-500/10">
            <Building2 className="size-10 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2">Ready for Your Interview</h1>
        <p className="text-lg text-muted-foreground">
          Review your configuration before starting
        </p>
      </div>

      <div className="space-y-6">
        {/* Visa Type */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center rounded-lg p-3 bg-blue-500/10">
              <Building2 className="size-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Visa Type</p>
              <h3 className="text-xl font-semibold">
                {visaType.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {visaType.code}
              </p>
            </div>
          </div>
        </Card>

        {/* Duration */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center rounded-lg p-3 bg-purple-500/10">
              <Clock className="size-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Duration</p>
              <h3 className="text-xl font-semibold">
                {duration?.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {duration?.credits} credits will be used
              </p>
            </div>
          </div>
        </Card>

        {/* Focus Areas */}
        {configuration.focusAreas.length > 0 && (
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center rounded-lg p-3 bg-green-500/10">
                <Target className="size-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Focus Areas</p>
                <div className="flex flex-wrap gap-2">
                  {configuration.focusAreas.map((areaId) => {
                    const area = visaType.focusAreas.find((a) => a.id === areaId);
                    return area ? (
                      <Badge key={areaId} variant="secondary">
                        {area.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Documents */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center rounded-lg p-3 bg-orange-500/10">
              <FileText className="size-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Documents Uploaded</p>
              <h3 className="text-xl font-semibold">
                {documentCount.uploaded} document{documentCount.uploaded !== 1 ? "s" : ""}
              </h3>
              {documentCount.uploaded > 0 ? (
                <p className="text-sm text-muted-foreground mt-1">
                  These will be referenced during your interview
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  No documents uploaded. The interview will proceed based on verbal responses.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Important Notes */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold mb-3">Before You Begin:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Ensure you're in a quiet environment</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>The interviewer will be professional but may be skeptical</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Speak clearly and answer questions directly</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} size="lg">
          <ChevronLeft className="size-4 mr-2" />
          Previous
        </Button>
        <Button onClick={handleStartInterview} size="lg" className="bg-blue-600 hover:bg-blue-700">
          Enter Interview Room
        </Button>
      </div>
      </div>
    </>
  );
}

