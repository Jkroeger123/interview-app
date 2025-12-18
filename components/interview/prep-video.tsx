"use client";

import { Card } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";
import { useState } from "react";

interface PrepVideoProps {
  visaType: string;
}

export function PrepVideo({ visaType }: PrepVideoProps) {
  const [hasWatched, setHasWatched] = useState(false);

  // Video mapping for different visa types
  const videoData: Record<string, { title: string; embedUrl: string; duration: string }> = {
    student: {
      title: "F-1 Student Visa Interview Preparation",
      embedUrl: "https://www.youtube.com/embed/placeholder-student-visa",
      duration: "3 minutes",
    },
    tourist: {
      title: "B-1/B-2 Tourist Visa Interview Preparation",
      embedUrl: "https://www.youtube.com/embed/placeholder-tourist-visa",
      duration: "3 minutes",
    },
    work: {
      title: "H-1B Work Visa Interview Preparation",
      embedUrl: "https://www.youtube.com/embed/placeholder-work-visa",
      duration: "3 minutes",
    },
    immigrant: {
      title: "Immigrant Visa Interview Preparation",
      embedUrl: "https://www.youtube.com/embed/placeholder-immigrant-visa",
      duration: "3 minutes",
    },
    fiance: {
      title: "K-1 Fiancé(e) Visa Interview Preparation",
      embedUrl: "https://www.youtube.com/embed/placeholder-fiance-visa",
      duration: "3 minutes",
    },
  };

  const video = videoData[visaType] || videoData.student;

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center rounded-lg p-3 bg-red-500/10">
          <PlayCircle className="size-5 text-red-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Preparation Video</p>
              <h3 className="text-lg font-semibold mt-1">{video.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{video.duration}</p>
            </div>
          </div>
          
          <div className="mt-4 rounded-lg overflow-hidden bg-black aspect-video">
            <iframe
              className="w-full h-full"
              src={video.embedUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onEnded={() => setHasWatched(true)}
            />
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            <p>
              <strong>What to expect:</strong> This video covers common questions, best practices,
              and tips for a successful interview experience.
            </p>
          </div>

          {hasWatched && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              ✓ Video watched - you're ready to begin!
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}





