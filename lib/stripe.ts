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

    // Fetch all checkout sessions for this customer
    const checkoutSessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 100,
    });

    console.log(`📝 Found ${checkoutSessions.data.length} checkout sessions`);

    let creditsAdded = 0;

    // Sync each checkout session
    for (const session of checkoutSessions.data) {
      // Only process completed sessions (status = "complete" means checkout finished successfully)
      // This works for both paid and free (100% coupon) checkouts
      if (session.status !== "complete") {
        console.log(
          `⏭️  Skipping session ${session.id} (status: ${session.status})`
        );
        continue;
      }

      // Check if already processed (by session ID - this is the unique identifier)
      const existing = await prisma.purchase.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      });

      if (existing) {
        console.log(`⏭️  Session ${session.id} already processed`);
        continue;
      }

      // Extract credits from metadata
      const credits = parseInt(session.metadata?.credits || "0");
      if (credits === 0) {
        console.log(`⏭️  Session ${session.id} has no credits metadata`);
        continue;
      }

      // Get payment intent ID if available (might be undefined for free checkouts with 100% coupon)
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || undefined;

      const amountPaid = (session.amount_total || 0) / 100;
      console.log(
        `💰 Processing session ${session.id}: ${credits} credits (amount: $${amountPaid}${amountPaid === 0 ? " - promotional" : ""})`
      );

      // Create purchase and credit ledger entry in transaction
      await prisma.$transaction(async (tx) => {
        // Create purchase record
        await tx.purchase.create({
          data: {
            userId: user.id,
            stripePaymentIntentId: paymentIntentId,
            stripeCheckoutSessionId: session.id,
            amount: session.amount_total || 0,
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
        const isPromotional = (session.amount_total || 0) === 0;
        await tx.creditLedger.create({
          data: {
            userId: user.id,
            amount: credits,
            balance: updatedUser.credits,
            type: "purchase",
            description: `Purchased ${credits} credits${isPromotional ? " (promotional)" : ""}`,
            referenceId: session.id,
          },
        });

        console.log(
          `✅ Added ${credits} credits. New balance: ${updatedUser.credits}`
        );
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
