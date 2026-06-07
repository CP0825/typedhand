import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, priceIdForTier } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export async function POST(request: Request) {
  let body: { tier?: string; interval?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const tier = body.tier;
  if (tier !== "student" && tier !== "pro") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  const interval = body.interval === "annual" ? "annual" : "monthly";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    return NextResponse.json(
      { error: "Could not load your account." },
      { status: 500 },
    );
  }

  try {
    const stripe = getStripe();

    // Reuse an existing Stripe customer if we have one, otherwise let Checkout
    // create one from the email and capture it via the webhook.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceIdForTier(tier, interval), quantity: 1 }],
      allow_promotion_codes: true,
      ...(profile.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: profile.email }),
      client_reference_id: profile.id,
      metadata: { user_id: profile.id, tier, interval },
      subscription_data: { metadata: { user_id: profile.id, tier, interval } },
      // session_id lets the dashboard reconcile the upgrade immediately on
      // return, independent of (and as a safety net for) the async webhook.
      success_url: `${APP_URL}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/dashboard`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout could not be started.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
