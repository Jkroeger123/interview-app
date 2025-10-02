"use client";

import { useEffect, useRef } from "react";
import type { ReceivedChatMessage } from "@livekit/components-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { LiveKitConfig } from "@/lib/types/livekit";

interface CallMessagesProps {
  messages: ReceivedChatMessage[];
  chatOpen: boolean;
  sessionStarted: boolean;
  config: LiveKitConfig;
}

export function CallMessages({
  messages,
  chatOpen,
  sessionStarted,
}: CallMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!sessionStarted) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 h-[calc(100vh-200px)] transition-opacity duration-300",
        chatOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <ScrollArea className="h-full px-4 pt-8 md:px-12">
        <div className="mx-auto max-w-2xl space-y-4 pb-8" ref={scrollRef}>
          {messages.map((message) => {
            const isAgent = message.from?.identity !== message.from?.identity; // Simplified check

            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isAgent ? "justify-start" : "justify-end"
                )}
              >
                <Card
                  className={cn(
                    "max-w-[80%] p-3",
                    isAgent ? "bg-muted" : "bg-primary text-primary-foreground"
                  )}
                >
                  <p className="text-sm">{message.message}</p>
                  {message.from && (
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        isAgent
                          ? "text-muted-foreground"
                          : "text-primary-foreground/70"
                      )}
                    >
                      {message.from.name || message.from.identity}
                    </p>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
