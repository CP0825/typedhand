"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BillingToggle } from "@/components/ui/BillingToggle";
import { track } from "@/lib/analytics";
import { PLAN_PRICING, type BillingInterval } from "@/lib/constants";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason: "limit_reached";
}

const COPY = {
  limit_reached: {
    title: "Remove the watermark",
    body: "Free includes unlimited exports — but they carry a small watermark. Upgrade to Plus for watermark-free exports and up to 5 fonts, or Pro for multi-page PDFs, 10 fonts and the Spanish & French templates.",
  },
};

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState<"student" | "pro" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const copy = COPY[reason];

  function priceLabel(tier: "student" | "pro") {
    const p = PLAN_PRICING[tier][interval];
    return `${p.amount}${p.suffix}`;
  }

  async function checkout(tier: "student" | "pro") {
    setLoading(tier);
    setError(null);
    track("upgrade_checkout_started", { tier, interval, source: "editor_modal" });
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={copy.title}>
      <p className="text-sm leading-relaxed text-th-ink-mid">{copy.body}</p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <BillingToggle value={interval} onChange={setInterval} annualNote="Save up to 51%" />
        {interval === "annual" && (
          <span className="text-xs text-th-ink-mid">
            {PLAN_PRICING.student.annual.saving} on Plus
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        <Button
          onClick={() => checkout("student")}
          disabled={loading !== null}
          size="lg"
        >
          {loading === "student"
            ? "Redirecting…"
            : `Upgrade to Plus — ${priceLabel("student")}`}
        </Button>
        <Button
          onClick={() => checkout("pro")}
          disabled={loading !== null}
          variant="secondary"
          size="lg"
        >
          {loading === "pro" ? "Redirecting…" : `Upgrade to Pro — ${priceLabel("pro")}`}
        </Button>
        <button
          onClick={onClose}
          className="mt-1 text-sm text-th-ink-light hover:text-th-ink"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
