"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_URL } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import {
  AuthShell,
  Field,
  FormError,
  FormNotice,
} from "@/components/auth/AuthShell";

// One page, two modes:
//   • "request" — enter email, receive a reset link (default).
//   • "update"  — arriving from the email link with a recovery session,
//                 choose a new password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Supabase fires PASSWORD_RECOVERY once the recovery session is set.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });

    // Also handle the case where the session is already present on mount.
    supabase.auth.getSession().then(({ data }) => {
      const url = new URL(window.location.href);
      if (data.session && url.searchParams.get("next") === "/reset-password") {
        setMode("update");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/auth/callback?next=/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError("Could not send the reset email. Please try again.");
      return;
    }
    setNotice(
      "If an account exists for that email, a reset link is on its way.",
    );
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("Could not update your password. The link may have expired.");
      return;
    }

    router.push("/editor");
    router.refresh();
  }

  if (mode === "update") {
    return (
      <AuthShell
        title="Set a new password"
        subtitle="Choose a new password for your account."
      >
        <form onSubmit={updatePassword} className="flex flex-col gap-4">
          {error && <FormError message={error} />}
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Saving…" : "Update password"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new password."
      footer={
        <Link href="/login" className="font-medium text-th-forest">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={requestReset} className="flex flex-col gap-4">
        {error && <FormError message={error} />}
        {notice && <FormNotice message={notice} />}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}
