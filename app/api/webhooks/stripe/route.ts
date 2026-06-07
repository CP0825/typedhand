import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, tierForPriceId } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyCheckoutUpgrade } from "@/lib/stripe/upgrade";

// Stripe needs the raw, unparsed body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const stripe = getStripe();
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Delegate to the shared, idempotent upgrade path (same one the
        // post-checkout redirect uses). It resolves the tier, writes the
        // profile, and logs every failure point.
        const result = await applyCheckoutUpgrade(session.id);
        if (!result.ok) {
          console.error(
            `[webhook] checkout.session.completed did not upgrade (session ${session.id}): ${result.reason}`,
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const tier = tierForPriceId(sub.items.data[0]?.price.id);

        // If the subscription is no longer active, treat as a downgrade.
        const active = ["active", "trialing", "past_due"].includes(sub.status);

        const { data, error } = await admin
          .from("profiles")
          .update({
            tier: active && tier ? tier : "free",
            stripe_subscription_id: sub.id,
          })
          .eq("stripe_customer_id", sub.customer as string)
          .select("id");
        if (error) {
          console.error("[webhook] subscription.updated DB error:", error);
        } else if (!data || data.length === 0) {
          console.warn(
            `[webhook] subscription.updated: no profile for customer ${String(sub.customer)}.`,
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { error } = await admin
          .from("profiles")
          .update({ tier: "free", stripe_subscription_id: null })
          .eq("stripe_customer_id", sub.customer as string)
          .select("id");
        if (error) {
          console.error("[webhook] subscription.deleted DB error:", error);
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
