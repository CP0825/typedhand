"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      // `scope: "local"` clears the cookie/local session without waiting on a
      // network round-trip to revoke the token server-side. The global revoke
      // could hang (offline / slow), leaving the button stuck on "Signing out…"
      // and looking like it does nothing — which was the reported bug.
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Even if the call throws, fall through to a hard navigation: the cookie
      // is cleared locally and the server will re-render in the signed-out state.
    }
    // Hard navigation (not router.push/refresh) guarantees the server components
    // — navbar included — re-read the now-empty session instead of showing a
    // stale signed-in shell from the client cache.
    window.location.assign("/");
  }

  return (
    <Button variant="secondary" size="sm" onClick={signOut} disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
