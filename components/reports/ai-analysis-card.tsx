"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, Star } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AIAnalysisData {
  performanceRating?: 1 | 2 | 3 | 4 | 5 | null;
  strengths: string[];
  weaknesses: string[];
  redFlags: Array<{
    timestamp: string;
    description: string;
  }>;
  timestampedComments: Array<{
    timestamp: string;
    comment: string;
    severity: "positive" | "neutral" | "concern";
  }>;
  summary: string;
}

interface AIAnalysisCardProps {
  analysis: AIAnalysisData;
}

export function AIAnalysisCard({ analysis }: AIAnalysisCardProps) {
  const getPerformanceStars = (rating: number) => {
    const labels = {
      5: "Strong Performance",
      4: "Above Average Performance",
      3: "Adequate Performance",
      2: "Below Average Performance",
      1: "Weak Performance",
    };
    
    const descriptions = {
      5: "Demonstrates excellent preparation and communication",
      4: "Shows good preparation with minor areas to improve",
      3: "Meets basic standards but needs improvement",
      2: "Significant gaps in preparation or communication",
      1: "Major deficiencies requiring substantial improvement",
    };
    
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-10 w-10 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {labels[rating as keyof typeof labels]}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {descriptions[rating as keyof typeof descriptions]}
          </p>
        </div>
      </div>
    );
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "positive":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "concern":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Rating */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Performance Evaluation</CardTitle>
          <CardDescription>
            Professional assessment of your interview performance based on established criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            {analysis.performanceRating ? (
              getPerformanceStars(analysis.performanceRating)
            ) : (
              <p className="text-sm text-muted-foreground">
                Performance rating not available
              </p>
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground italic mt-4 border-t pt-4">
            This evaluation reflects interview performance quality based on established guidelines. 
            It does not predict or speculate on visa application outcomes.
          </p>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Red Flags */}
      {analysis.redFlags.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Critical Concerns
            </CardTitle>
            <CardDescription>
              These issues should be addressed before a real interview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.redFlags.map((flag, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <div className="flex-shrink-0">
                    <Badge variant="destructive">{flag.timestamp}</Badge>
                  </div>
                  <p className="text-sm">{flag.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamped Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feedback Timeline</CardTitle>
          <CardDescription>
            Specific observations throughout your interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {analysis.timestampedComments.map((comment, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {getSeverityIcon(comment.severity)}
                    <Badge variant="outline">{comment.timestamp}</Badge>
                    <span className="text-sm flex-1">
                      {comment.comment.substring(0, 60)}
                      {comment.comment.length > 60 ? "..." : ""}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm pl-10 pr-4">{comment.comment}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

