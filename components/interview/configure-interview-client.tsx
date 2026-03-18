"use client";

import { useRouter } from "next/navigation";
import { useInterview } from "@/lib/contexts/interview-context";
import { VISA_TYPES, INTERVIEW_DURATIONS } from "@/lib/visa-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Coins, Info, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageSelector } from "@/components/interview/language-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EphemeralFileUpload } from "@/components/interview/ephemeral-file-upload";
import { ParticipantNamesInput } from "@/components/interview/participant-names-input";
import Link from "next/link";

interface ConfigureInterviewClientProps {
  userCredits: number;
}

export function ConfigureInterviewClient({ userCredits }: ConfigureInterviewClientProps) {
  const router = useRouter();
  const { configuration, setDuration, toggleFocusArea, setParticipantNames } = useInterview();
  const [draftInterviewId, setDraftInterviewId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // Redirect if no visa type is selected
  useEffect(() => {
    if (!configuration.visaType) {
      router.push("/select-visa");
    }
  }, [configuration.visaType, router]);

  // Create or get draft interview for document uploads
  useEffect(() => {
    if (!configuration.visaType || draftInterviewId) return;

    const fetchDraftInterview = async () => {
      setIsLoadingDraft(true);
      try {
        const response = await fetch("/api/interviews/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visaType: configuration.visaType }),
        });

        if (response.ok) {
          const data = await response.json();
          setDraftInterviewId(data.interview.id);
          console.log("✅ Draft interview ready:", data.interview.id);
        }
      } catch (error) {
        console.error("Error fetching draft interview:", error);
      } finally {
        setIsLoadingDraft(false);
      }
    };

    fetchDraftInterview();
  }, [configuration.visaType, draftInterviewId]);

  if (!configuration.visaType) {
    return null;
  }

  const visaType = VISA_TYPES[configuration.visaType];
  const selectedDuration = INTERVIEW_DURATIONS.find(
    (d) => d.value === configuration.duration
  );

  // Check if this is a marriage/fiance visa (requires dual participants)
  const isMarriageVisa = configuration.visaType === "fiance" || configuration.visaType === "immigrant";
  const requiresParticipantNames = isMarriageVisa;

  // Calculate required credits based on duration
  const requiredCredits = selectedDuration?.credits || 10;
  const hasEnoughCredits = userCredits >= requiredCredits;

  const handleNext = () => {
    if (!hasEnoughCredits) return;
    
    // Validate participant names for marriage visas
    if (requiresParticipantNames && (!configuration.participant1Name || !configuration.participant2Name)) {
      alert("Please enter both participant names for the marriage visa interview.");
      return;
    }
    
    // Go to interview ready page
    router.push("/interview-ready");
  };

  const handlePrevious = () => {
    router.push("/select-visa");
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full bg-blue-600" />
        <div className="h-1 flex-1 rounded-full bg-blue-600" />
        <div className="h-1 flex-1 rounded-full bg-muted" />
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Interview Configuration</h1>
        <p className="text-lg text-muted-foreground">
          {visaType.name} ({visaType.code})
        </p>
      </div>

      <Card className="p-8">
        <div className="space-y-8">
          {/* Interview Level */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label htmlFor="duration" className="text-lg font-semibold">
                Interview Level
            </Label>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full hover:bg-accent transition-colors p-1"
                    >
                      <Info className="size-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-3 text-sm">
                      <p>
                        <strong>Basic:</strong> Surface-level questioning on key
                        topics. Quick overview to test basic preparedness (~5 min).
                      </p>
                      <p>
                        <strong>Standard:</strong> Surface-level questions plus
                        deep dive into 1-2 key areas. Recommended for most users
                        (~10 min).
                      </p>
                      <p>
                        <strong>In-Depth:</strong> Comprehensive deep dive into
                        all question bank sections. Best for thorough preparation
                        (~15 min).
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={configuration.duration}
              onValueChange={(value) => setDuration(value as any)}
            >
              <SelectTrigger id="duration" className="w-full">
                <SelectValue>
                  {selectedDuration && (
                    <div className="flex items-center gap-2">
                      <span>{selectedDuration.label}</span>
                      {selectedDuration.value === "standard" && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_DURATIONS.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {duration.label}
                        </span>
                        {duration.value === "standard" && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {duration.description} • {duration.credits} credits
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDuration && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Coins className="size-4" />
                  {selectedDuration.credits} credits • ~{selectedDuration.minutes} minutes
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedDuration.description}
                </p>
              </div>
            )}
          </div>

          {/* Interview Language */}
          <LanguageSelector />

          {/* Participant Names (Marriage/Fiance Visas Only) */}
          {isMarriageVisa && (
            <ParticipantNamesInput
              participant1Name={configuration.participant1Name}
              participant2Name={configuration.participant2Name}
              onParticipantNamesChange={setParticipantNames}
            />
          )}

          {/* Focus Areas */}
          <div>
            <Label className="text-lg font-semibold mb-3 block">
              Focus Areas{" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Customize the duration and focus areas for your practice session
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visaType.focusAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Checkbox
                    id={area.id}
                    checked={configuration.focusAreas.includes(area.id)}
                    onCheckedChange={() => toggleFocusArea(area.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={area.id}
                      className="font-medium cursor-pointer"
                    >
                      {area.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {area.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Document Upload Section */}
      <div className="mt-6">
        <EphemeralFileUpload />
      </div>

      {/* Insufficient Credits Warning */}
      {!hasEnoughCredits && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="size-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">Insufficient Credits</p>
              <p className="text-sm mt-1">
                You need {requiredCredits} credits for this interview but only
                have {userCredits} credits.
              </p>
            </div>
            <Link href="/credits">
              <Button variant="secondary" size="sm">
                <Coins className="size-4 mr-2" />
                Buy Credits
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} size="lg">
          <ChevronLeft className="size-4 mr-2" />
          Previous
        </Button>
        <Button onClick={handleNext} size="lg" disabled={!hasEnoughCredits}>
          Next
          <ChevronRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

