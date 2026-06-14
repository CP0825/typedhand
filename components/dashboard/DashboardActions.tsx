"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BillingToggle } from "@/components/ui/BillingToggle";
import { track } from "@/lib/analytics";
import { PLAN_PRICING, type Tier, type BillingInterval } from "@/lib/constants";

export function DashboardActions({ tier }: { tier: Tier }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  function planLabel(target: "student" | "pro") {
    const p = PLAN_PRICING[target][interval];
    const name = target === "student" ? "Plus" : "Pro";
    return `Upgrade to ${name} — ${p.amount}${p.suffix}`;
  }

  async function startCheckout(target: "student" | "pro") {
    setLoading(target);
    setError(null);
    track("upgrade_checkout_started", {
      tier: target,
      interval,
      source: "dashboard",
    });
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: target, interval }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not open portal.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {tier !== "pro" && (
        <div className="flex items-center gap-3">
          <BillingToggle value={interval} onChange={setInterval} annualNote="Save up to 51%" />
          {interval === "annual" && (
            <span className="text-xs text-th-editor-muted">
              {tier === "free"
                ? `${PLAN_PRICING.student.annual.perMonth} · ${PLAN_PRICING.student.annual.saving}`
                : `${PLAN_PRICING.pro.annual.perMonth} · ${PLAN_PRICING.pro.annual.saving}`}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2.5">
        {tier === "free" && (
          <Button variant="action" onClick={() => startCheckout("student")} disabled={loading !== null}>
            {loading === "student" ? "Redirecting…" : planLabel("student")}
          </Button>
        )}
        {(tier === "free" || tier === "student") && (
          <Button
            variant={tier === "free" ? "dark-secondary" : "action"}
            onClick={() => startCheckout("pro")}
            disabled={loading !== null}
          >
            {loading === "pro" ? "Redirecting…" : planLabel("pro")}
          </Button>
        )}
        {tier !== "free" && (
          <Button
            variant="dark-secondary"
            onClick={openPortal}
            disabled={loading !== null}
          >
            {loading === "portal" ? "Opening…" : "Manage subscription"}
          </Button>
        )}
      </div>
    </div>
  );
}
