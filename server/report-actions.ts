"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { generateReport } from "@/lib/openai-report-generator";
import { getFormattedTranscript } from "./transcript-actions";

/**
 * Generate AI-powered analysis report for an interview
 */
export async function generateAIReport(interviewId: string) {
  try {
    // Get interview details
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        transcriptSegments: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!interview) {
      throw new Error("Interview not found");
    }

    // Check if report already exists
    const existingReport = await prisma.interviewReport.findUnique({
      where: { interviewId },
    });

    if (existingReport) {
      console.log("Report already exists for interview:", interviewId);
      return { success: true, report: existingReport };
    }

    // Get formatted transcript
    const transcriptResult = await getFormattedTranscript(interviewId);
    if (!transcriptResult.success) {
      throw new Error("Failed to get transcript for report generation");
    }

    if (!("transcript" in transcriptResult) || !transcriptResult.transcript) {
      throw new Error("Transcript not available");
    }

    console.log("🤖 Generating AI report for interview:", interviewId);

    // Generate AI report
    const reportData = await generateReport(
      transcriptResult.transcript,
      interview.visaType,
      `Interview Date: ${interview.startedAt.toLocaleDateString()}\nDuration: ${interview.duration ? Math.floor(interview.duration / 60) : "N/A"} minutes`
    );

    // Store report in database
    const report = await prisma.interviewReport.create({
      data: {
        interviewId,
        overallScore: reportData.overallScore,
        recommendation: reportData.recommendation,
        strengths: JSON.stringify(reportData.strengths),
        weaknesses: JSON.stringify(reportData.weaknesses),
        redFlags: JSON.stringify(reportData.redFlags),
        timestampedComments: JSON.stringify(reportData.timestampedComments),
        summary: reportData.summary,
      },
    });

    console.log("✅ Generated and stored AI report:", report.id);
    return { success: true, report };
  } catch (error) {
    console.error("❌ Error generating AI report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate report",
    };
  }
}

/**
 * Get report by interview ID
 */
export async function getReportByInterviewId(interviewId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify interview ownership
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new Error("Interview not found");
    }

    if (interview.clerkId !== user.id) {
      throw new Error("Access denied");
    }

    // Fetch report
    const report = await prisma.interviewReport.findUnique({
      where: { interviewId },
    });

    if (!report) {
      return { success: false, error: "Report not found" };
    }

    // Parse JSON fields
    const parsedReport = {
      ...report,
      recommendation: report.recommendation as "approve" | "deny" | "further_review",
      strengths: JSON.parse(report.strengths) as string[],
      weaknesses: JSON.parse(report.weaknesses) as string[],
      redFlags: JSON.parse(report.redFlags) as Array<{
        timestamp: string;
        description: string;
      }>,
      timestampedComments: JSON.parse(report.timestampedComments) as Array<{
        timestamp: string;
        comment: string;
        severity: "positive" | "neutral" | "concern";
      }>,
    };

    return { success: true, report: parsedReport };
  } catch (error) {
    console.error("❌ Error fetching report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch report",
    };
  }
}

/**
 * Check if a report exists for an interview
 */
export async function checkReportExists(interviewId: string) {
  try {
    const report = await prisma.interviewReport.findUnique({
      where: { interviewId },
      select: { id: true },
    });

    return { success: true, exists: !!report };
  } catch (error) {
    console.error("❌ Error checking report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check report",
    };
  }
}

/**
 * Regenerate a report (useful if feedback algorithm improves)
 */
export async function regenerateReport(interviewId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify interview ownership
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new Error("Interview not found");
    }

    if (interview.clerkId !== user.id) {
      throw new Error("Access denied");
    }

    // Delete existing report if it exists
    await prisma.interviewReport.delete({
      where: { interviewId },
    }).catch(() => {
      // Report doesn't exist, that's fine
    });

    // Generate new report
    return await generateAIReport(interviewId);
  } catch (error) {
    console.error("❌ Error regenerating report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to regenerate report",
    };
  }
}

