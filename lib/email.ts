import { Resend } from "resend";
import { render } from "@react-email/render";
import { ReportReadyEmail } from "@/emails/report-ready";
import { DeletionWarningEmail } from "@/emails/deletion-warning";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Vysa <noreply@vysa.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface ReportReadyEmailData {
  to: string;
  userName: string;
  visaType: string;
  interviewDate: string;
  interviewId: string;
  overallScore?: number;
  recommendation?: string;
}

export interface DeletionWarningEmailData {
  to: string;
  userName: string;
  visaType: string;
  interviewDate: string;
  expirationDate: string;
  interviewId: string;
  hoursRemaining?: number;
}

/**
 * Send email when interview report is ready
 */
export async function sendReportReadyEmail(data: ReportReadyEmailData) {
  try {
    const reportUrl = `${APP_URL}/reports/${data.interviewId}`;

    const emailHtml = render(
      ReportReadyEmail({
        userName: data.userName,
        visaType: data.visaType,
        interviewDate: data.interviewDate,
        reportUrl,
        overallScore: data.overallScore,
        recommendation: data.recommendation,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `✅ Your ${data.visaType} Interview Report is Ready!`,
      html: emailHtml,
    });

    console.log(`✅ Report ready email sent to ${data.to}:`, result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("❌ Error sending report ready email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send warning email 24 hours before report deletion
 */
export async function sendDeletionWarningEmail(data: DeletionWarningEmailData) {
  try {
    const reportUrl = `${APP_URL}/reports/${data.interviewId}`;

    const emailHtml = render(
      DeletionWarningEmail({
        userName: data.userName,
        visaType: data.visaType,
        interviewDate: data.interviewDate,
        expirationDate: data.expirationDate,
        reportUrl,
        hoursRemaining: data.hoursRemaining || 24,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `⏰ Your ${data.visaType} Interview Report Expires in ${data.hoursRemaining || 24} Hours`,
      html: emailHtml,
    });

    console.log(`✅ Deletion warning email sent to ${data.to}:`, result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("❌ Error sending deletion warning email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}



