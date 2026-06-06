import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { APP_URL, CONSENT_VERSION, MIN_SIGNUP_AGE } from "@/lib/constants";

// Server-side signup endpoint. The age gate is enforced HERE (authoritatively),
// not only in the browser: under-16 users are hard-blocked and no account is
// created. The raw date of birth is used solely for the age check and is then
// discarded — it is never persisted anywhere.

const UNDER_AGE_MESSAGE =
  "TypedHand requires users to be 16 or older. We're unable to create an account for you.";

// Whole years between an ISO `yyyy-mm-dd` date and today, or null if unparseable.
function ageFromDob(dob: string): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export async function POST(request: Request) {
  let body: {
    email?: string;
    password?: string;
    dob?: string;
    consent?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const dob = typeof body.dob === "string" ? body.dob : "";
  const consent = body.consent === true;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  // ── Age gate (server-side, authoritative) ────────────────────────────────
  const age = ageFromDob(dob);
  if (age === null || age < 0 || age > 120) {
    return NextResponse.json(
      { error: "Please enter a valid date of birth." },
      { status: 400 },
    );
  }
  if (age < MIN_SIGNUP_AGE) {
    // Hard block: no account, no stored data.
    return NextResponse.json({ error: UNDER_AGE_MESSAGE }, { status: 403 });
  }
  // From here on `dob`/`age` are intentionally discarded — never persisted.

  if (!consent) {
    return NextResponse.json(
      { error: "You must confirm your age and accept the Terms and Privacy Policy." },
      { status: 400 },
    );
  }

  // Plain anon client (no cookie session): we only trigger the confirmation
  // email; the session is established later via the email-callback flow.
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${APP_URL}/auth/callback?next=/dashboard`,
      // Consent is logged server-side by the handle_new_user trigger
      // (migration 006), which stamps consent_timestamp with now(). We store
      // only the derived confirmation flag — never the date of birth.
      data: {
        confirmed_age_16_plus: true,
        consent_version: CONSENT_VERSION,
      },
    },
  });

  if (error) {
    const already = error.message.toLowerCase().includes("already");
    return NextResponse.json(
      {
        error: already
          ? "An account with this email already exists."
          : error.message,
      },
      { status: already ? 409 : 400 },
    );
  }

  // Supabase returns a user with an empty identities array when the email is
  // already registered (and confirmation is on) — surface that as a conflict.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
