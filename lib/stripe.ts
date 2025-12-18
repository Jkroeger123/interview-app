import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

/**
 * Sync Stripe data to Prisma database
 * 
 * This is the single source of truth for credit purchases.
 * Called from:
 * - Success page (eager sync to avoid race conditions)
 * - Webhook handler (when payment events occur)
 * 
 * Philosophy: Keep one sync function that handles all credit updates.
 * Avoids split-brain issues with webhooks and partial updates.
 */
export async function syncStripeDataToPrisma(customerId: string) {
  console.log(`🔄 Syncing Stripe data for customer: ${customerId}`);

  try {
    // Get userId from stripeCustomerId
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true, credits: true },
    });

    if (!user) {
      console.error(`❌ User not found for Stripe customer: ${customerId}`);
      throw new Error("User not found for Stripe customer");
    }

    console.log(`✅ Found user: ${user.id} with ${user.credits} credits`);

    // Fetch all successful payment intents for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 100,
    });

    console.log(`📝 Found ${paymentIntents.data.length} payment intents`);

    let creditsAdded = 0;

    // Sync each payment intent
    for (const intent of paymentIntents.data) {
      // Only process succeeded payments
      if (intent.status !== "succeeded") {
        console.log(`⏭️  Skipping payment intent ${intent.id} (status: ${intent.status})`);
        continue;
      }

      // Check if already processed
      const existing = await prisma.purchase.findUnique({
        where: { stripePaymentIntentId: intent.id },
      });

      if (existing) {
        console.log(`⏭️  Payment intent ${intent.id} already processed`);
        continue;
      }

      // Extract credits from metadata
      const credits = parseInt(intent.metadata.credits || "0");
      if (credits === 0) {
        console.log(`⏭️  Payment intent ${intent.id} has no credits metadata`);
        continue;
      }

      console.log(`💰 Processing payment intent ${intent.id}: ${credits} credits`);

      // Create purchase and credit ledger entry in transaction
      await prisma.$transaction(async (tx) => {
        // Create purchase record
        await tx.purchase.create({
          data: {
            userId: user.id,
            stripePaymentIntentId: intent.id,
            amount: intent.amount,
            credits,
            status: "completed",
          },
        });

        // Add credits to user
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { credits: { increment: credits } },
        });

        // Create ledger entry
        await tx.creditLedger.create({
          data: {
            userId: user.id,
            amount: credits,
            balance: updatedUser.credits,
            type: "purchase",
            description: `Purchased ${credits} credits`,
            referenceId: intent.id,
          },
        });

        console.log(`✅ Added ${credits} credits. New balance: ${updatedUser.credits}`);
      });

      creditsAdded += credits;
    }

    // Get final credit balance
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    console.log(
      `🎉 Sync complete! Added ${creditsAdded} credits. Final balance: ${finalUser?.credits || 0}`
    );

    return finalUser;
  } catch (error) {
    console.error("❌ Error syncing Stripe data:", error);
    throw error;
  }
}



