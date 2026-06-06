import Stripe from "stripe";

let cached: Stripe | null = null;

// Lazily instantiated server-side Stripe client. Kept lazy so importing this
// module during build (e.g. for route collection) does not require the secret
// key to be present.
export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }

  cached = new Stripe(key, {
    apiVersion: "2024-06-20",
    typescript: true,
  });
  return cached;
}

import type { BillingInterval } from "@/lib/constants";

// Maps a Stripe Price ID back to our internal tier. Used by the webhook, so it
// must recognise both the monthly and annual price IDs for each tier.
export function tierForPriceId(priceId: string | null | undefined):
  | "student"
  | "pro"
  | null {
  if (!priceId) return null;
  if (
    priceId === process.env.STRIPE_PRICE_STUDENT ||
    priceId === process.env.STRIPE_PRICE_ID_STUDENT_ANNUAL
  ) {
    return "student";
  }
  if (
    priceId === process.env.STRIPE_PRICE_PRO ||
    priceId === process.env.STRIPE_PRICE_ID_PRO_ANNUAL
  ) {
    return "pro";
  }
  return null;
}

export function priceIdForTier(
  tier: "student" | "pro",
  interval: BillingInterval = "monthly",
): string {
  // Monthly ids already exist (STRIPE_PRICE_STUDENT / STRIPE_PRICE_PRO).
  // TODO(constantin): create the annual Stripe prices and set
  // STRIPE_PRICE_ID_STUDENT_ANNUAL and STRIPE_PRICE_ID_PRO_ANNUAL.
  const id =
    tier === "student"
      ? interval === "annual"
        ? process.env.STRIPE_PRICE_ID_STUDENT_ANNUAL
        : process.env.STRIPE_PRICE_STUDENT
      : interval === "annual"
        ? process.env.STRIPE_PRICE_ID_PRO_ANNUAL
        : process.env.STRIPE_PRICE_PRO;
  if (!id) {
    throw new Error(
      `Missing Stripe price ID for tier "${tier}" (${interval}).`,
    );
  }
  return id;
}
