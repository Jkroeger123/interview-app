"use client";

import { useVoiceAssistant } from "@livekit/components-react";
import { Mic, Brain, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AgentStateIndicator() {
  const { state: agentState } = useVoiceAssistant();

  // Don't show anything if agent is not connected yet
  if (agentState === "disconnected" || agentState === "connecting") {
    return null;
  }

  const stateConfig = {
    listening: {
      icon: Mic,
      label: "Listening",
      helperText: "You can speak now",
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      helperTextColor: "text-green-600",
      pulse: true,
    },
    thinking: {
      icon: Brain,
      label: "Thinking",
      helperText: "Please wait...",
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      helperTextColor: "text-amber-600",
      pulse: false,
    },
    speaking: {
      icon: Volume2,
      label: "Speaking",
      helperText: "Please listen",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      helperTextColor: "text-blue-600",
      pulse: true,
    },
  };

  const config = stateConfig[agentState as keyof typeof stateConfig];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 transition-all duration-300 shadow-sm",
          config.bgColor,
          config.borderColor,
          config.textColor,
          "border-2 font-medium"
        )}
      >
        <div className="relative flex items-center justify-center">
          <Icon className="h-4 w-4" />
          {config.pulse && (
            <span
              className={cn(
                "absolute -inset-1 rounded-full opacity-75 animate-ping",
                config.color
              )}
            />
          )}
        </div>
        <span className="text-sm font-semibold">{config.label}</span>
      </Badge>
      <p
        className={cn(
          "text-xs font-medium transition-all duration-300",
          config.helperTextColor
        )}
      >
        {config.helperText}
      </p>
    </div>
  );
}

// Compact version for smaller spaces
export function AgentStateIndicatorCompact() {
  const { state: agentState } = useVoiceAssistant();

  // Don't show anything if agent is not connected yet
  if (agentState === "disconnected" || agentState === "connecting") {
    return null;
  }

  const stateConfig = {
    listening: {
      icon: Mic,
      color: "bg-green-500",
      ringColor: "ring-green-400",
      pulse: true,
    },
    thinking: {
      icon: Brain,
      color: "bg-amber-500",
      ringColor: "ring-amber-400",
      pulse: false,
    },
    speaking: {
      icon: Volume2,
      color: "bg-blue-500",
      ringColor: "ring-blue-400",
      pulse: true,
    },
  };

  const config = stateConfig[agentState as keyof typeof stateConfig];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
        config.color,
        "ring-2 ring-offset-2",
        config.ringColor
      )}
    >
      <Icon className="h-5 w-5 text-white" />
      {config.pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-75 animate-ping",
            config.color
          )}
        />
      )}
    </div>
  );
}
