import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { renderToStream } from "@react-pdf/renderer";
import { getInterviewById } from "@/server/interview-actions";
import { getReportByInterviewId } from "@/server/report-actions";
import { ReportPDFTemplate } from "@/components/reports/report-pdf-template";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const user = await currentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch interview data
  const interviewResult = await getInterviewById(id);
  
  if (!interviewResult.success || !interviewResult.interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  const interview = interviewResult.interview;

  // Check ownership
  if (interview.clerkId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch report data
  const reportResult = await getReportByInterviewId(id);
  
  if (!reportResult.success || !reportResult.report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Format data for PDF
  const formattedDate = new Date(interview.startedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = new Date(interview.startedAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const durationMinutes = interview.duration ? Math.floor(interview.duration / 60) : null;

  try {
    // Generate PDF
    const stream = await renderToStream(
      ReportPDFTemplate({
        interviewDate: formattedDate,
        interviewTime: formattedTime,
        duration: durationMinutes,
        visaType: interview.visaType,
        analysis: reportResult.report,
        transcriptSegments: interview.transcriptSegments || [],
      })
    );

    // Convert Node.js stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        stream.on("end", () => {
          controller.close();
        });
        stream.on("error", (err: Error) => {
          controller.error(err);
        });
      },
    });

    // Generate filename
    const filename = `interview-report-${interview.visaType}-${new Date(interview.startedAt)
      .toISOString()
      .split("T")[0]}.pdf`;

    // Return PDF with appropriate headers
    return new Response(webStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
