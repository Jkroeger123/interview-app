import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts (optional - using default fonts for simplicity)

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #333",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  scoreBox: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 4,
  },
  scoreGreen: {
    color: "#16a34a",
  },
  scoreYellow: {
    color: "#ca8a04",
  },
  scoreRed: {
    color: "#dc2626",
  },
  scoreLabel: {
    fontSize: 10,
    color: "#666",
  },
  badge: {
    backgroundColor: "#333",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    textAlign: "center",
  },
  badgeGreen: {
    backgroundColor: "#16a34a",
  },
  badgeRed: {
    backgroundColor: "#dc2626",
  },
  badgeYellow: {
    backgroundColor: "#ca8a04",
  },
  list: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 10,
  },
  bullet: {
    marginRight: 8,
    fontSize: 14,
  },
  bulletGreen: {
    color: "#16a34a",
  },
  bulletRed: {
    color: "#dc2626",
  },
  bulletYellow: {
    color: "#ca8a04",
  },
  listText: {
    flex: 1,
    lineHeight: 1.5,
  },
  grid: {
    flexDirection: "row",
    gap: 10,
  },
  gridItem: {
    flex: 1,
  },
  timestampComment: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeft: "3 solid #ddd",
  },
  timestampBadge: {
    fontSize: 9,
    color: "#666",
    marginBottom: 4,
  },
  commentText: {
    lineHeight: 1.5,
  },
  transcriptItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 4,
  },
  transcriptHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  speaker: {
    fontWeight: "bold",
    fontSize: 10,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 9,
    color: "#666",
  },
  transcriptText: {
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#666",
    borderTop: "1 solid #ddd",
    paddingTop: 10,
  },
  summaryText: {
    lineHeight: 1.6,
    textAlign: "justify",
  },
});

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

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

interface ReportPDFTemplateProps {
  interviewDate: string;
  interviewTime: string;
  duration: number | null;
  visaType: string;
  analysis: AIAnalysisData;
  transcriptSegments: TranscriptSegment[];
}

export function ReportPDFTemplate({
  interviewDate,
  interviewTime,
  duration,
  visaType,
  analysis,
  transcriptSegments,
}: ReportPDFTemplateProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return styles.scoreGreen;
    if (score >= 60) return styles.scoreYellow;
    return styles.scoreRed;
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "approve":
        return { text: "Likely Approval", style: styles.badgeGreen };
      case "deny":
        return { text: "Needs Improvement", style: styles.badgeRed };
      case "further_review":
        return { text: "Further Review", style: styles.badgeYellow };
      default:
        return { text: recommendation, style: styles.badge };
    }
  };

  // Calculate start time from first transcript segment (Unix epoch timestamp)
  const startTimestamp = transcriptSegments.length > 0 ? transcriptSegments[0].startTime : 0;

  // Format relative time from interview start
  const formatTime = (timestamp: number) => {
    // Convert Unix epoch timestamp to relative seconds from start
    const relativeSeconds = timestamp - startTimestamp;
    const mins = Math.floor(relativeSeconds / 60);
    const secs = Math.floor(relativeSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const recommendationBadge = getRecommendationBadge(analysis.recommendation);

  return (
    <Document>
      {/* Page 1: Overview & Analysis */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Interview Report</Text>
          <Text style={styles.subtitle}>
            {interviewDate} at {interviewTime}
          </Text>
          <Text style={styles.subtitle}>
            {visaType.charAt(0).toUpperCase() + visaType.slice(1)} Visa
            {duration !== null && ` • ${duration} minutes`}
          </Text>
        </View>

        {/* Performance Score & Recommendation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interview Performance</Text>
          <View style={styles.card}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Overall Score</Text>
                <Text style={[styles.scoreValue, getScoreColor(analysis.overallScore)]}>
                  {analysis.overallScore}/100
                </Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Recommendation</Text>
                <View style={[styles.badge, recommendationBadge.style]}>
                  <Text>{recommendationBadge.text}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.card}>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </View>
        </View>

        {/* Strengths & Weaknesses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strengths & Areas for Improvement</Text>
          <View style={styles.grid}>
            {/* Strengths */}
            <View style={styles.gridItem}>
              <Text style={{ fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
                ✓ Strengths
              </Text>
              <View style={styles.list}>
                {analysis.strengths.map((strength, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={[styles.bullet, styles.bulletGreen]}>•</Text>
                    <Text style={styles.listText}>{strength}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Weaknesses */}
            <View style={styles.gridItem}>
              <Text style={{ fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
                ⚠ Areas for Improvement
              </Text>
              <View style={styles.list}>
                {analysis.weaknesses.map((weakness, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={[styles.bullet, styles.bulletYellow]}>•</Text>
                    <Text style={styles.listText}>{weakness}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Red Flags */}
        {analysis.redFlags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Critical Concerns</Text>
            <View style={styles.card}>
              {analysis.redFlags.map((flag, index) => (
                <View key={index} style={styles.timestampComment}>
                  <Text style={styles.timestampBadge}>[{flag.timestamp}]</Text>
                  <Text style={styles.commentText}>{flag.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages} • Generated on ${new Date().toLocaleDateString()}`
          }
          fixed
        />
      </Page>

      {/* Page 2: Detailed Feedback Timeline */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Detailed Feedback Timeline</Text>
        </View>

        <View style={styles.section}>
          {analysis.timestampedComments.map((comment, index) => (
            <View key={index} style={styles.timestampComment}>
              <Text style={styles.timestampBadge}>[{comment.timestamp}]</Text>
              <Text style={styles.commentText}>{comment.comment}</Text>
            </View>
          ))}
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages} • Generated on ${new Date().toLocaleDateString()}`
          }
          fixed
        />
      </Page>

      {/* Page 3+: Transcript */}
      {transcriptSegments.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Interview Transcript</Text>
          </View>

          <View style={styles.section}>
            {transcriptSegments.map((segment, index) => (
              <View key={index} style={styles.transcriptItem}>
                <View style={styles.transcriptHeader}>
                  <Text style={styles.speaker}>
                    {segment.speaker === "agent" ? "Visa Officer" : "Applicant"}:
                  </Text>
                  <Text style={styles.timestamp}>[{formatTime(segment.startTime)}]</Text>
                </View>
                <Text style={styles.transcriptText}>{segment.text}</Text>
              </View>
            ))}
          </View>

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages} • Generated on ${new Date().toLocaleDateString()}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  );
}
