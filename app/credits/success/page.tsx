import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncStripeDataToPrisma } from "@/lib/stripe";

/**
 * Success page after Stripe checkout
 * 
 * CRITICAL: Eagerly syncs Stripe data to avoid race conditions with webhooks.
 * Per the guide: "Your user will make it back to your site before the webhooks do."
 * 
 * We sync immediately so credits appear right away, then redirect to credits page.
 */
export default async function SuccessPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  try {
    // Get user's Stripe customer ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { stripeCustomerId: true },
    });

    if (dbUser?.stripeCustomerId) {
      console.log(`🔄 Success page: Eagerly syncing for customer ${dbUser.stripeCustomerId}`);

      // Eagerly sync to avoid race conditions
      // This ensures credits appear immediately
      await syncStripeDataToPrisma(dbUser.stripeCustomerId);

      console.log("✅ Success page: Sync complete!");
    } else {
      console.warn("⚠️  Success page: No Stripe customer ID found");
    }
  } catch (error) {
    console.error("❌ Success page: Error syncing:", error);
    // Don't fail the redirect - webhook will catch it
  }

  // Redirect to credits page to see new balance
  redirect("/credits");
}



