import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// POST: Create or get a draft interview for document uploads
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { visaType } = await req.json();

    if (!visaType) {
      return NextResponse.json(
        { error: "Visa type required" },
        { status: 400 }
      );
    }

    // Get or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email:
            user.emailAddresses[0]?.emailAddress || `${user.id}@unknown.com`,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          imageUrl: user.imageUrl || undefined,
        },
      });
    }

    // Look for existing draft interview for this user and visa type
    let interview = await prisma.interview.findFirst({
      where: {
        userId: dbUser.id,
        visaType,
        status: "draft",
      },
      include: {
        documents: true,
      },
      orderBy: { startedAt: "desc" },
    });

    if (interview) {
      console.log("✅ Found existing draft interview:", interview.id);
      return NextResponse.json({ interview });
    }

    // Create new draft interview with temporary room name
    const tempRoomName = `draft_${visaType}_${Date.now()}_${dbUser.id}`;
    interview = await prisma.interview.create({
      data: {
        userId: dbUser.id,
        clerkId: user.id,
        roomName: tempRoomName,
        visaType,
        status: "draft", // Draft status - not started yet
        recordingStatus: "pending",
        transcriptStatus: "pending",
      },
      include: {
        documents: true,
      },
    });

    console.log("✅ Created draft interview:", interview.id);
    return NextResponse.json({ interview });
  } catch (error) {
    console.error("Error creating draft interview:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create draft interview",
      },
      { status: 500 }
    );
  }
}
