"use client";

import { useRouter } from "next/navigation";
import { useInterview } from "@/lib/contexts/interview-context";
import { VISA_TYPES, INTERVIEW_DURATIONS } from "@/lib/visa-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
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
import { ChevronLeft, ChevronRight, Coins, Info } from "lucide-react";
import { useEffect } from "react";
import { LanguageSelector } from "@/components/interview/language-selector";

export default function ConfigureInterviewPage() {
  const router = useRouter();
  const { configuration, setDuration, toggleFocusArea } = useInterview();

  // Redirect if no visa type is selected
  useEffect(() => {
    if (!configuration.visaType) {
      router.push("/select-visa");
    }
  }, [configuration.visaType, router]);

  if (!configuration.visaType) {
    return null;
  }

  const visaType = VISA_TYPES[configuration.visaType];
  const selectedDuration = INTERVIEW_DURATIONS.find(
    (d) => d.value === configuration.duration
  );

  const handleNext = () => {
    // Skip document upload - go straight to interview ready
    router.push("/interview-ready");
  };

  const handlePrevious = () => {
    router.push("/select-visa");
  };

  return (
    <>
      <Navbar />
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
            {/* Interview Duration */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Label
                  htmlFor="duration"
                  className="text-lg font-semibold"
                >
                  Interview Duration
                </Label>
                <TooltipProvider>
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
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Quick (5 min):</strong> Brief overview of key topics - ideal for testing specific areas
                        </p>
                        <p>
                          <strong>Standard (10 min):</strong> Balanced practice covering main questions - recommended for most users
                        </p>
                        <p>
                          <strong>Comprehensive (15 min):</strong> In-depth interview covering all topics - best for thorough preparation
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_DURATIONS.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      <div className="flex items-center gap-2">
                        <span>{duration.label} ({duration.credits} credits)</span>
                        {duration.value === "standard" && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDuration && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                  <Coins className="size-4" />
                  This interview will cost {selectedDuration.credits} credits
                </p>
              )}
            </div>

            {/* Interview Language */}
            <LanguageSelector />

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

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} size="lg">
            <ChevronLeft className="size-4 mr-2" />
            Previous
          </Button>
          <Button onClick={handleNext} size="lg">
            Next
            <ChevronRight className="size-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  );
}
