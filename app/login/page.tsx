"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import {
  AuthShell,
  Field,
  FormError,
} from "@/components/auth/AuthShell";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error"),
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      // "Email not confirmed" is worth saying plainly; everything else maps to
      // a single friendly message so we don't leak which field was wrong.
      setError(
        /confirm/i.test(error.message)
          ? "Please confirm your email address first — check your inbox."
          : "That email and password don't match. Please try again.",
      );
      return;
    }

    // Sign-in reported success — confirm a session actually came back before we
    // navigate. Without this guard a missing session sends the user to a
    // protected route the middleware then bounces straight back to /login.
    if (!data.session) {
      setLoading(false);
      setError("Something went wrong signing you in. Please try again.");
      return;
    }

    // Hard navigation (full page load) rather than router.push/refresh: it
    // guarantees the freshly-written Supabase session cookie is sent with the
    // request to the protected route, so middleware sees the user. A soft
    // client navigation often drops that cookie on iOS Safari, which bounces
    // the user straight back to /login (the redirect loop seen on iPad).
    const from = params.get("redirectedFrom");
    const redirectTo =
      from && from.startsWith("/") && !from.startsWith("/login")
        ? from
        : "/dashboard";
    window.location.assign(redirectTo);
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep writing."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-th-forest">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <FormError message={error} />}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link
            href="/reset-password"
            className="mt-1.5 inline-block text-xs text-th-ink-mid hover:text-th-ink"
          >
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
