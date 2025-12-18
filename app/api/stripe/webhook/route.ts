import { NextResponse } from "next/server";
import { stripe, syncStripeDataToPrisma } from "@/lib/stripe";
import Stripe from "stripe";

/**
 * Relevant Stripe events for credit purchases
 * 
 * Per the guide: Only track events that affect payment state.
 * We don't need 258 events - just the ones that matter for one-time payments.
 */
const relevantEvents: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
];

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ No Stripe signature found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log(`🔔 Received Stripe webhook: ${event.type}`);

    // Skip processing if event isn't relevant
    if (!relevantEvents.includes(event.type)) {
      console.log(`⏭️  Skipping irrelevant event: ${event.type}`);
      return NextResponse.json({ received: true });
    }

    // Process the event
    await processEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Webhook error", message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}

/**
 * Process a Stripe event
 * 
 * Extracts customer ID and syncs data to Prisma.
 * This is the single sync function per the guide's philosophy.
 */
async function processEvent(event: Stripe.Event) {
  try {
    // All events we track have a customer field
    const eventObject = event.data.object as { customer?: string };
    const customerId = eventObject.customer;

    if (typeof customerId !== "string") {
      console.error(
        `⚠️  Event ${event.type} doesn't have a customer ID or it's not a string`
      );
      // Don't throw - some events might not have customer
      return;
    }

    console.log(`🔄 Processing event ${event.type} for customer ${customerId}`);

    // Call the single sync function (per guide's philosophy)
    await syncStripeDataToPrisma(customerId);

    console.log(`✅ Successfully processed event ${event.type}`);
  } catch (error) {
    console.error(`❌ Error processing event ${event.type}:`, error);
    // Don't throw - we don't want to fail the webhook
    // Stripe will retry and we can fix issues in the meantime
  }
}



