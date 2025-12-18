"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the current user's credit balance
 */
export async function getUserCredits(): Promise<number> {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: { credits: true },
  });

  if (!dbUser) {
    // User not found in database - return 0 credits
    // This handles race conditions where Clerk webhook hasn't synced yet
    return 0;
  }

  return dbUser.credits;
}

/**
 * Check if user has enough credits for an interview
 */
export async function checkSufficientCredits(requiredCredits: number): Promise<{
  sufficient: boolean;
  currentCredits: number;
  requiredCredits: number;
}> {
  const currentCredits = await getUserCredits();

  return {
    sufficient: currentCredits >= requiredCredits,
    currentCredits,
    requiredCredits,
  };
}

