"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MIN_SIGNUP_AGE } from "@/lib/constants";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/Button";
import { AuthShell, Field, FormError } from "@/components/auth/AuthShell";

// Whole years between `dob` and today, or null if unparseable.
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

const UNDER_AGE_MESSAGE =
  "TypedHand requires users to be 16 or older. We're unable to create an account for you.";

export default function SignupPage() {
  const router = useRouter();
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const age = ageFromDob(dob);
  // Once a full, valid DOB is entered we know whether the user is under age.
  const underAge = age !== null && age < MIN_SIGNUP_AGE;
  const oldEnough = age !== null && age >= MIN_SIGNUP_AGE;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (age === null) {
      setError("Please enter your date of birth.");
      return;
    }
    // Client-side mirror of the hard block (the server re-validates).
    if (underAge) {
      setError(UNDER_AGE_MESSAGE);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!consent) {
      setError("Please confirm your age and accept the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    setError(null);
    track("signup_submitted");

    // The age gate is enforced authoritatively on the server; the raw date of
    // birth is sent only for that check and is never stored.
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, dob, consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(data?.error || "Could not create your account.");
        return;
      }
      track("signup_succeeded");
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      setLoading(false);
      setError("Could not reach the server. Please try again.");
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start turning typed text into your own handwriting — free."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-th-forest">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <FormError message={error} />}

        {/* Date of birth comes first — it gates everything below it. */}
        <div>
          <Field
            label="Date of birth"
            type="date"
            autoComplete="bday"
            required
            value={dob}
            onChange={(e) => {
              setDob(e.target.value);
              setError(null);
            }}
          />
          <p className="mt-1.5 text-xs text-th-ink-light">
            We use this only to check you&apos;re old enough. We don&apos;t store
            your date of birth.
          </p>
        </div>

        {underAge ? (
          // Hard block: no further fields, no account creation.
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700">
            {UNDER_AGE_MESSAGE}
          </p>
        ) : (
          <>
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              required
              disabled={!oldEnough}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={!oldEnough}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-th-ink-mid">
              <input
                type="checkbox"
                checked={consent}
                disabled={!oldEnough}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-th-forest"
              />
              <span>
                I confirm I am 16 or older and agree to the{" "}
                <Link href="/datenschutz" className="underline" target="_blank">
                  Datenschutzerklärung
                </Link>{" "}
                and{" "}
                <Link href="/agb" className="underline" target="_blank">
                  AGB
                </Link>
                .
              </span>
            </label>

            <Button type="submit" size="lg" disabled={loading || !oldEnough || !consent}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </>
        )}
      </form>
    </AuthShell>
  );
}
