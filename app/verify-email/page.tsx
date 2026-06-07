"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_URL } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { AuthShell, FormError, FormNotice } from "@/components/auth/AuthShell";

function VerifyEmailInner() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function resend() {
    if (!email) return;
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${APP_URL}/auth/callback?next=/editor` },
    });
    if (error) {
      setStatus("error");
      setMessage("Could not resend the email. Please try again in a moment.");
    } else {
      setStatus("sent");
      setMessage("Verification email sent. Check your inbox.");
    }
  }

  return (
    <AuthShell
      title="Check your inbox"
      subtitle={
        email
          ? `We sent a verification link to ${email}. Click it to activate your account.`
          : "We sent you a verification link. Click it to activate your account."
      }
      footer={
        <Link href="/login" className="font-medium text-th-forest">
          Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col gap-4">
        {status === "sent" && message && <FormNotice message={message} />}
        {status === "error" && message && <FormError message={message} />}
        <p className="text-sm text-th-ink-mid">
          Didn&apos;t get it? Check your spam folder, or resend below.
        </p>
        <Button
          variant="secondary"
          size="lg"
          onClick={resend}
          disabled={!email}
        >
          Resend verification email
        </Button>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
