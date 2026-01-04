/**
 * Stripe Credit Pack Configuration
 *
 * Simple credit packs: $1 per credit
 * - 5 credits = $5
 * - 10 credits = $10
 * - 50 credits = $50
 */

export const CREDIT_PACKS = [
  {
    id: "pack_5",
    name: "Trial Pack",
    credits: 5,
    price: 500, // $5 in cents
    priceId: process.env.STRIPE_PRICE_ID_5 || "",
    description: "Perfect for trying out the platform",
    popular: false,
  },
  {
    id: "pack_10",
    name: "Starter Pack",
    credits: 10,
    price: 1000, // $10 in cents
    priceId: process.env.STRIPE_PRICE_ID_10 || "",
    description: "Great for regular practice",
    popular: true,
  },
  {
    id: "pack_50",
    name: "Pro Pack",
    credits: 50,
    price: 5000, // $50 in cents
    priceId: process.env.STRIPE_PRICE_ID_50 || "",
    description: "Best value for serious preparation",
    popular: false,
  },
] as const;

export type CreditPack = (typeof CREDIT_PACKS)[number];
