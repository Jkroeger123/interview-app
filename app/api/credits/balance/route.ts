import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's credit balance
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { credits: true },
    });

    if (!dbUser) {
      // Return 0 credits if user doesn't exist yet
      return NextResponse.json({ credits: 0 });
    }

    return NextResponse.json({ credits: dbUser.credits });
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit balance" },
      { status: 500 }
    );
  }
}



