import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect from Supabase email links (verification + password
// recovery). Exchanges the `code` for a session, then forwards the user on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // The code can fail to exchange even on a perfectly valid link: mail clients
    // often prefetch the URL (consuming the one-time code) and users sometimes
    // click twice. In those cases a valid session already exists — so before
    // showing a scary "could not verify" error, check whether the user is in
    // fact signed in and, if so, treat the verification as successful.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "We could not verify that link. Please request a new one.",
    )}`,
  );
}
