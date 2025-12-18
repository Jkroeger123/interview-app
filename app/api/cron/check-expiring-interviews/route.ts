import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDeletionWarningEmail } from "@/lib/email";
import { VISA_TYPES } from "@/lib/visa-types";

// This endpoint should be called by a cron job (e.g., Vercel Cron, external service)
// Call it daily to check for expiring interviews and send warning emails
//
// NOTE: S3 video files are automatically deleted by AWS S3 Lifecycle Rules (7 day TTL)
// No need to manually delete S3 files - AWS handles it automatically

export async function GET(request: Request) {
  try {
    // Verify authorization (cron secret or Vercel Cron header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("🔍 Checking for expiring interviews...");

    const now = new Date();
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Find interviews that:
    // 1. Are completed
    // 2. Expire within the next 24 hours
    // 3. Haven't had a warning email sent yet
    const expiringInterviews = await prisma.interview.findMany({
      where: {
        status: "completed",
        expiresAt: {
          gte: now,
          lte: oneDayFromNow,
        },
        expirationWarningSent: false,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`📧 Found ${expiringInterviews.length} interviews expiring soon`);

    // Send warning emails
    let emailsSent = 0;
    
    for (const interview of expiringInterviews) {
      try {
        console.log(`📧 Sending warning email to: ${interview.user.email}`);
        console.log(`   Interview ID: ${interview.id}`);
        console.log(`   Expires at: ${interview.expiresAt?.toISOString()}`);

        // Get visa type name
        const visaTypeData = VISA_TYPES[interview.visaType as keyof typeof VISA_TYPES];
        const visaTypeName = visaTypeData ? `${visaTypeData.name} (${visaTypeData.code})` : interview.visaType;

        // Calculate hours remaining
        const hoursRemaining = interview.expiresAt 
          ? Math.max(0, Math.round((interview.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
          : 24;

        // Send deletion warning email
        const emailResult = await sendDeletionWarningEmail({
          to: interview.user.email,
          userName: interview.user.firstName || "there",
          visaType: visaTypeName,
          interviewDate: interview.startedAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          expirationDate: interview.expiresAt?.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }) || "Unknown",
          interviewId: interview.id,
          hoursRemaining,
        });

        if (emailResult.success) {
          // Mark as sent
          await prisma.interview.update({
            where: { id: interview.id },
            data: { expirationWarningSent: true },
          });

          console.log(`✅ Warning email sent and marked for interview: ${interview.id}`);
          emailsSent++;
        } else {
          console.error(`⚠️ Failed to send email for interview ${interview.id}:`, emailResult.error);
        }
      } catch (error) {
        console.error(`❌ Error sending warning email for interview ${interview.id}:`, error);
      }
    }

    console.log(`📧 Sent ${emailsSent} out of ${expiringInterviews.length} warning emails`);

    // Find and delete interviews that have passed their expiration date
    const expiredInterviews = await prisma.interview.findMany({
      where: {
        status: {
          in: ["completed", "in_progress"],
        },
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        roomName: true,
      },
    });

    console.log(`🗑️ Found ${expiredInterviews.length} expired interviews to delete`);
    console.log(`📁 S3 files will be auto-deleted by AWS Lifecycle Rules (no action needed)`);

    // Delete expired interviews from database
    // Note: S3 files are automatically deleted by AWS S3 Lifecycle Rules (7 day TTL)
    let deletedCount = 0;
    
    for (const interview of expiredInterviews) {
      try {
        console.log(`🗑️ Deleting expired interview: ${interview.id}`);

        // Delete interview from database (cascades to transcripts and reports)
        await prisma.interview.delete({
          where: { id: interview.id },
        });
        
        console.log(`  ✅ Deleted interview record and related data: ${interview.id}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Error deleting interview ${interview.id}:`, error);
      }
    }

    console.log(`🎉 Cleanup complete: ${deletedCount} interviews deleted from database`);

    return NextResponse.json({
      success: true,
      warningsSent: expiringInterviews.length,
      interviewsDeleted: deletedCount,
      note: "S3 files are automatically deleted by AWS Lifecycle Rules",
    });
  } catch (error) {
    console.error("❌ Error checking expiring interviews:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



