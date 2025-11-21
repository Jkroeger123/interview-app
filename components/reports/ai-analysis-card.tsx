"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AIAnalysisData {
  overallScore: number;
  recommendation: "approve" | "deny" | "further_review";
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
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "approve":
        return <Badge className="bg-green-600">Likely Approval</Badge>;
      case "deny":
        return <Badge variant="destructive">Needs Improvement</Badge>;
      case "further_review":
        return <Badge variant="secondary">Further Review</Badge>;
      default:
        return <Badge>{recommendation}</Badge>;
    }
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
      {/* Overall Score and Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Performance</CardTitle>
          <CardDescription>AI-generated analysis of your interview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <div
                className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}
              >
                {analysis.overallScore}
                <span className="text-2xl">/100</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Recommendation</p>
              <div className="flex justify-center">
                {getRecommendationBadge(analysis.recommendation)}
              </div>
            </div>
          </div>
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

