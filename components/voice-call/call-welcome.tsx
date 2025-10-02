"use client";

import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CallWelcomeProps {
  disabled: boolean;
  onStartCall: () => void;
}

export function CallWelcome({ disabled, onStartCall }: CallWelcomeProps) {
  return (
    <section
      className={cn(
        "fixed inset-x-0 top-16 bottom-0 z-20 mx-auto flex flex-col items-center justify-center bg-background text-center transition-opacity duration-500",
        disabled ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <div className="flex size-20 items-center justify-center rounded-full bg-blue-500/10 mb-6">
        <Building2 className="size-10 text-blue-600" />
      </div>

      <h1 className="mb-2 text-3xl font-bold">U.S. Visa Interview Simulator</h1>
      <p className="mb-4 text-lg text-muted-foreground">
        Mock Interview Practice
      </p>
      <p className="mb-8 max-w-lg text-sm text-muted-foreground">
        Prepare for your visa interview with realistic practice. The AI officer
        will ask probing questions about your purpose of visit, financial
        situation, and ties to your home country.
      </p>

      <Button
        size="lg"
        onClick={onStartCall}
        className="min-w-72 bg-blue-600 hover:bg-blue-700"
      >
        Enter Interview Room
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        Please have your documents ready
      </p>
    </section>
  );
}
