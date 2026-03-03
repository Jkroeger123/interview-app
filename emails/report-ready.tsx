import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface ReportReadyEmailProps {
  userName: string;
  visaType: string;
  interviewDate: string;
  reportUrl: string;
  performanceRating?: number;
  recommendation?: string; // Deprecated, kept for backward compatibility
}

export const ReportReadyEmail = ({
  userName = "there",
  visaType = "Student Visa (F-1)",
  interviewDate = "January 1, 2024",
  reportUrl = "https://vysa.app/reports/123",
  performanceRating,
  recommendation,
}: ReportReadyEmailProps) => {
  const getRecommendationColor = (rec?: string) => {
    switch (rec) {
      case "approve":
        return "#16a34a"; // green
      case "deny":
        return "#dc2626"; // red
      case "further_review":
        return "#ca8a04"; // yellow
      default:
        return "#3b82f6"; // blue
    }
  };

  const getRecommendationText = (rec?: string) => {
    switch (rec) {
      case "approve":
        return "Recommended for Approval";
      case "deny":
        return "Areas Need Improvement";
      case "further_review":
        return "Needs Further Review";
      default:
        return "Analysis Complete";
    }
  };

  const getStars = (rating: number) => {
    return "⭐".repeat(rating);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "#16a34a"; // green
    if (rating >= 3) return "#ca8a04"; // yellow
    return "#dc2626"; // red
  };

  const getRatingText = (rating: number) => {
    const labels: Record<number, string> = {
      5: "Strong Performance",
      4: "Above Average Performance",
      3: "Adequate Performance",
      2: "Below Average Performance",
      1: "Weak Performance",
    };
    return labels[rating] || "Performance Rating";
  };

  return (
    <Html>
      <Head />
      <Preview>Your interview report is ready to view</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>✅ Your Interview Report is Ready!</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={text}>Hello {userName},</Text>
            
            <Text style={text}>
              Great news! We've finished analyzing your <strong>{visaType}</strong> practice
              interview from <strong>{interviewDate}</strong>.
            </Text>

            {performanceRating && (
              <Section style={scoreBox}>
                <Text style={scoreLabel}>Performance Rating</Text>
                <Text style={scoreValue}>{getStars(performanceRating)}</Text>
                <Text
                  style={{
                    ...recommendationBadge,
                    backgroundColor: getRatingColor(performanceRating),
                  }}
                >
                  {getRatingText(performanceRating)}
                </Text>
                <Text style={{ ...scoreLabel, marginTop: "12px", textTransform: "none" as const, fontSize: "12px" }}>
                  Interview performance based on established criteria
                </Text>
              </Section>
            )}

            <Text style={text}>
              Your detailed report includes:
            </Text>

            <ul style={list}>
              <li style={listItem}>📊 Complete interview transcript</li>
              <li style={listItem}>🎥 Video recording of your interview</li>
              <li style={listItem}>💡 AI-powered analysis and feedback</li>
              <li style={listItem}>💪 Strengths and areas for improvement</li>
              <li style={listItem}>🚩 Important red flags to address</li>
              <li style={listItem}>⏱️ Timestamped comments throughout</li>
            </ul>

            <Section style={buttonContainer}>
              <Button style={button} href={reportUrl}>
                View Your Report
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              <strong>⏰ Important:</strong> Your report will be available for{" "}
              <strong>7 days</strong>. After that, it will be automatically deleted
              for your privacy. You'll receive a reminder 24 hours before deletion.
            </Text>

            <Text style={footer}>
              Need to practice more? Start another interview anytime to continue
              improving your skills!
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Best regards,
              <br />
              The Vysa Team
            </Text>
            <Hr style={hr} />
            <Text style={footerText}>
              © {new Date().getFullYear()} Vysa. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ReportReadyEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 40px",
  backgroundColor: "#3b82f6",
  borderRadius: "8px 8px 0 0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "center" as const,
};

const content = {
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const scoreBox = {
  backgroundColor: "#f8fafc",
  border: "2px solid #e2e8f0",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const scoreLabel = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px 0",
};

const scoreValue = {
  color: "#1e293b",
  fontSize: "36px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const recommendationBadge = {
  display: "inline-block",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "8px 16px",
  borderRadius: "20px",
  margin: "8px 0 0 0",
};

const list = {
  margin: "16px 0",
  paddingLeft: "0",
};

const listItem = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "8px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 0",
  backgroundColor: "#fef3c7",
  padding: "16px",
  borderRadius: "6px",
  borderLeft: "4px solid #f59e0b",
};

const footerSection = {
  padding: "0 40px",
  marginTop: "32px",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "8px 0",
};



