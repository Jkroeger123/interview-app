import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { CREDIT_PACKS } from "@/lib/stripe-config";

export async function POST(req: Request) {
  try {
    // Verify authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pack ID from request
    const body = await req.json();
    const { packId } = body;

    if (!packId) {
      return NextResponse.json({ error: "Pack ID is required" }, { status: 400 });
    }

    // Find the selected pack
    const pack = CREDIT_PACKS.find((p) => p.id === packId);

    if (!pack) {
      return NextResponse.json({ error: "Invalid pack ID" }, { status: 400 });
    }

    // Validate price ID is configured
    if (!pack.priceId) {
      return NextResponse.json(
        { error: "Pack price ID not configured. Please set STRIPE_PRICE_ID_* env variables." },
        { status: 500 }
      );
    }

    console.log(`🛒 Creating checkout for ${pack.name} (${pack.credits} credits)`);

    // Get or create database user
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, stripeCustomerId: true, email: true },
    });

    if (!dbUser) {
      // Create user if doesn't exist (fallback for race conditions)
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          imageUrl: user.imageUrl || null,
        },
        select: { id: true, stripeCustomerId: true, email: true },
      });
    }

    let stripeCustomerId = dbUser.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    // CRITICAL: Always create customer BEFORE checkout (per guide)
    if (!stripeCustomerId) {
      console.log("🆕 Creating new Stripe customer");

      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: {
          userId: dbUser.id,
          clerkId: user.id,
        },
      });

      // Store customer ID in database
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId: customer.id },
      });

      stripeCustomerId = customer.id;
      console.log(`✅ Created Stripe customer: ${customer.id}`);
    } else {
      console.log(`✅ Using existing Stripe customer: ${stripeCustomerId}`);
    }

    // Create checkout session with customer ID
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId, // CRITICAL: Always set customer ID
      payment_method_types: ["card"],
      line_items: [
        {
          price: pack.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits`,
      metadata: {
        userId: dbUser.id,
        credits: pack.credits.toString(),
        packId: pack.id,
      },
      payment_intent_data: {
        metadata: {
          userId: dbUser.id,
          credits: pack.credits.toString(),
          packId: pack.id,
        },
      },
    });

    console.log(`✅ Created checkout session: ${session.id}`);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



