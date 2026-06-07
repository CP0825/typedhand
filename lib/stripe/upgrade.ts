import "server-only";
import { getStripe, tierForPriceId } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tier } from "@/lib/constants";

export interface UpgradeResult {
  ok: boolean;
  tier?: Tier;
  reason?: string;
}

/**
 * Resolves the purchased tier for a completed Stripe Checkout Session and writes
 * it to the user's profile.
 *
 * This is the single source of truth for "payment succeeded -> upgrade plan".
 * It is idempotent and is called from BOTH:
 *   1. the Stripe webhook (checkout.session.completed), and
 *   2. the post-checkout redirect reconciliation (dashboard ?session_id=...).
 * Having both paths means a missed, delayed, or misconfigured webhook never
 * leaves a paying user stuck on Free — the redirect repairs it on next load.
 *
 * `expectedUserId`, when provided (the redirect path), guards against a user
 * reconciling a session that isn't theirs.
 */
export async function applyCheckoutUpgrade(
  sessionId: string,
  expectedUserId?: string,
): Promise<UpgradeResult> {
  const stripe = getStripe();

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch (err) {
    console.error(`[upgrade] Could not retrieve session ${sessionId}:`, err);
    return { ok: false, reason: "session_not_found" };
  }

  const userId =
    session.metadata?.user_id || session.client_reference_id || null;
  if (!userId) {
    console.warn(`[upgrade] Session ${sessionId} has no user_id.`);
    return { ok: false, reason: "no_user_id" };
  }
  if (expectedUserId && userId !== expectedUserId) {
    console.warn(
      `[upgrade] Session ${sessionId} belongs to ${userId}, not ${expectedUserId}.`,
    );
    return { ok: false, reason: "user_mismatch" };
  }

  // Only act on a paid/complete checkout. Stripe marks subscription checkouts
  // "paid" + "complete" once the first invoice is settled.
  if (session.payment_status !== "paid" && session.status !== "complete") {
    return { ok: false, reason: "not_paid" };
  }

  const subscription =
    session.subscription && typeof session.subscription !== "string"
      ? session.subscription
      : null;
  const subscriptionId =
    subscription?.id ??
    (typeof session.subscription === "string" ? session.subscription : null);

  // Prefer the actual purchased price -> tier; fall back to the checkout
  // metadata; finally default to Student so a paying user is never left on Free.
  let tier: Tier | null =
    tierForPriceId(subscription?.items.data[0]?.price.id) ??
    ((session.metadata?.tier as "student" | "pro") || null);
  if (!tier) {
    console.warn(
      `[upgrade] Could not resolve tier for session ${sessionId}; defaulting to student.`,
    );
    tier = "student";
  }

  const customerId =
    typeof session.customer === "string" ? session.customer : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({
      tier,
      ...(customerId ? { stripe_customer_id: customerId } : {}),
      ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
    })
    .eq("id", userId)
    .select("id, tier");

  if (error) {
    console.error(`[upgrade] DB update failed for user ${userId}:`, error);
    return { ok: false, reason: "db_error" };
  }
  if (!data || data.length === 0) {
    console.warn(`[upgrade] No profile row found for user ${userId}.`);
    return { ok: false, reason: "no_profile" };
  }

  console.log(
    `[upgrade] User ${userId} upgraded to "${tier}" (session ${sessionId}).`,
  );
  return { ok: true, tier };
}
