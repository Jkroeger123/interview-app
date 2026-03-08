"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Info, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ParticipantNamesInputProps {
  participant1Name?: string;
  participant2Name?: string;
  onParticipantNamesChange: (participant1: string, participant2: string) => void;
}

export function ParticipantNamesInput({
  participant1Name = "",
  participant2Name = "",
  onParticipantNamesChange,
}: ParticipantNamesInputProps) {
  const [name1, setName1] = useState(participant1Name);
  const [name2, setName2] = useState(participant2Name);

  // Update parent when names change
  const handleName1Change = (value: string) => {
    setName1(value);
    if (value && name2) {
      onParticipantNamesChange(value, name2);
    }
  };

  const handleName2Change = (value: string) => {
    setName2(value);
    if (name1 && value) {
      onParticipantNamesChange(name1, value);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users className="size-5 text-muted-foreground" />
        <Label className="text-lg font-semibold">
          Interview Participants
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
              <p className="text-sm">
                Marriage visa interviews typically involve both the U.S. citizen
                petitioner and the foreign national beneficiary. The AI interviewer
                will be able to direct questions to either participant.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="p-6 space-y-4 bg-muted/50">
        <div className="space-y-2">
          <Label htmlFor="participant1" className="text-sm font-medium">
            Participant 1 Name (U.S. Citizen Petitioner)
          </Label>
          <Input
            id="participant1"
            type="text"
            placeholder="e.g., John Smith"
            value={name1}
            onChange={(e) => handleName1Change(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="participant2" className="text-sm font-medium">
            Participant 2 Name (Foreign National Beneficiary)
          </Label>
          <Input
            id="participant2"
            type="text"
            placeholder="e.g., Maria Garcia"
            value={name2}
            onChange={(e) => handleName2Change(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="text-xs text-muted-foreground bg-background p-3 rounded-md border">
          <p className="font-medium mb-1">💡 Tip:</p>
          <p>
            The interviewer will address both participants by name and may direct
            specific questions to either person. Use context clues from the
            interviewer's questions to know who should respond.
          </p>
        </div>
      </Card>
    </div>
  );
}
