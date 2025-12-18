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

interface DeletionWarningEmailProps {
  userName: string;
  visaType: string;
  interviewDate: string;
  expirationDate: string;
  reportUrl: string;
  hoursRemaining: number;
}

export const DeletionWarningEmail = ({
  userName = "there",
  visaType = "Student Visa (F-1)",
  interviewDate = "January 1, 2024",
  expirationDate = "January 8, 2024",
  reportUrl = "https://vysa.app/reports/123",
  hoursRemaining = 24,
}: DeletionWarningEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your interview report will be deleted in {hoursRemaining} hours</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>⏰ Report Expiring Soon</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={text}>Hello {userName},</Text>
            
            <Section style={warningBox}>
              <Text style={warningIcon}>⚠️</Text>
              <Text style={warningText}>
                Your interview report will be permanently deleted in approximately{" "}
                <strong>{hoursRemaining} hours</strong>
              </Text>
            </Section>

            <Text style={text}>
              This is a friendly reminder that your <strong>{visaType}</strong> interview
              report from <strong>{interviewDate}</strong> will be automatically deleted
              on <strong>{expirationDate}</strong>.
            </Text>

            <Text style={text}>
              <strong>What will be deleted:</strong>
            </Text>

            <ul style={list}>
              <li style={listItem}>📊 Interview transcript</li>
              <li style={listItem}>🎥 Video recording</li>
              <li style={listItem}>💡 AI analysis and feedback</li>
              <li style={listItem}>📈 Performance scores</li>
              <li style={listItem}>📝 All timestamped comments</li>
            </ul>

            <Section style={actionBox}>
              <Text style={actionText}>
                <strong>Action Required:</strong>
              </Text>
              <Text style={actionText}>
                If you haven't reviewed your report yet, please do so before it's deleted.
                Once deleted, this data cannot be recovered.
              </Text>

              <Section style={buttonContainer}>
                <Button style={button} href={reportUrl}>
                  View Report Now
                </Button>
              </Section>
            </Section>

            <Hr style={hr} />

            <Text style={infoText}>
              <strong>Why do reports expire?</strong>
              <br />
              We automatically delete interview data after 7 days to protect your privacy
              and keep your information secure. This ensures your practice interview
              recordings and analysis are only stored as long as needed.
            </Text>

            <Text style={infoText}>
              Want to keep practicing? You can start a new interview anytime, and we'll
              generate a fresh report for you!
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

export default DeletionWarningEmail;

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
  backgroundColor: "#f59e0b",
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

const warningBox = {
  backgroundColor: "#fef3c7",
  border: "2px solid #fbbf24",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const warningIcon = {
  fontSize: "48px",
  margin: "0 0 12px 0",
};

const warningText = {
  color: "#92400e",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "0",
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

const actionBox = {
  backgroundColor: "#f1f5f9",
  border: "2px solid #cbd5e1",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const actionText = {
  color: "#1e293b",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "16px 0 0 0",
};

const button = {
  backgroundColor: "#f59e0b",
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

const infoText = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 0",
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



