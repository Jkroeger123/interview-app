"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface TranscriptDisplayProps {
  segments: TranscriptSegment[];
}

export function TranscriptDisplay({ segments }: TranscriptDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter segments based on search
  const filteredSegments = segments.filter((segment) =>
    segment.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Transcript</CardTitle>
        <CardDescription>Full conversation between you and the visa officer</CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {filteredSegments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No results found" : "No transcript available"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSegments.map((segment) => (
                <div
                  key={segment.id}
                  className={`flex gap-3 ${
                    segment.speaker === "agent"
                      ? "bg-muted/50 p-3 rounded-lg"
                      : "p-3"
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium ${
                        segment.speaker === "agent"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {segment.speaker === "agent" ? "VO" : "You"}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {segment.speaker === "agent" ? "Visa Officer" : "Applicant"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{segment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

