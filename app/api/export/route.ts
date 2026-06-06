import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateExport, isResetDue, nextResetDate } from "@/lib/tier-logic";
import type { Profile } from "@/lib/types";

// Authoritative export gate. The client cannot be trusted to enforce tiers or
// the monthly cap, so every export passes through here:
//   1. Re-validate the session.
//   2. Roll over the monthly counter if due.
//   3. Decide eligibility from the *server-side* tier + count.
//   4. On success, increment the counter and write an audit row.
//   5. Return the treatment (watermark / high-res / multi-page) to the client.
export async function POST(request: Request) {
  let body: { exportType?: string; font?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const exportType = body.exportType;
  const font = typeof body.font === "string" ? body.font : "Unknown";

  // PDF is the only supported export format now (PNG was removed).
  if (exportType !== "pdf") {
    return NextResponse.json(
      { error: "Unsupported export type." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Could not load your account." },
      { status: 500 },
    );
  }

  // Roll over the monthly window if the reset date has passed.
  let effectiveCount = profile.export_count;
  let resetDate = profile.export_reset_date;
  if (isResetDue(profile.export_reset_date)) {
    effectiveCount = 0;
    resetDate = nextResetDate().toISOString();
  }

  const decision = evaluateExport({
    tier: profile.tier,
    effectiveCount,
  });

  if (!decision.allowed) {
    return NextResponse.json(
      { error: "Export not allowed.", reason: decision.reason },
      { status: 403 },
    );
  }

  // Commit the new count (and any rollover) atomically-ish, then log.
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      export_count: effectiveCount + 1,
      export_reset_date: resetDate,
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Could not record the export. Please try again." },
      { status: 500 },
    );
  }

  await admin.from("exports").insert({
    user_id: profile.id,
    export_type: exportType,
    font_used: font,
  });

  return NextResponse.json({
    allowed: true,
    watermark: decision.watermark,
    multiPage: decision.multiPage,
    remaining:
      decision.remaining === Infinity ? null : decision.remaining - 1,
  });
}
