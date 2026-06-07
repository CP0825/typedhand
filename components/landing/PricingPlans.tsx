"use client";

import { useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { BillingToggle } from "@/components/ui/BillingToggle";
import { PLAN_PRICING, type BillingInterval } from "@/lib/constants";

// Landing-page pricing with a monthly/annual toggle. Free has no billing
// interval; Student and Pro switch price, show the per-month equivalent and the
// annual saving, and the annual Student plan is marked as recommended.
export function PricingPlans() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const annual = interval === "annual";

  const student = PLAN_PRICING.student[interval];
  const pro = PLAN_PRICING.pro[interval];

  return (
    <>
      <div className="mt-6 flex justify-center">
        <BillingToggle value={interval} onChange={setInterval} annualNote="Save up to 51%" />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <PricingCard
          name="Free"
          price="€0"
          period="forever"
          features={[
            "1 PDF export / month",
            "1 handwriting font",
            "Standard letters template",
            "Subtle watermark",
          ]}
          cta="Start free"
          href="/signup"
        />
        <PricingCard
          name="Student"
          price={student.amount}
          period={annual ? PLAN_PRICING.student.annual.suffix : PLAN_PRICING.student.monthly.suffix}
          subline={
            annual
              ? `${PLAN_PRICING.student.annual.perMonth} · ${PLAN_PRICING.student.annual.saving}`
              : undefined
          }
          badge={annual ? "Recommended" : "Most popular"}
          highlighted
          features={[
            "5 PDF exports / month",
            "No watermark",
            "Up to 5 handwriting fonts",
            "Letters, numbers & symbol templates",
            "Character size variation & rotation controls",
            "Randomised line-start offset",
            "Snap text to lined & squared paper",
          ]}
          cta="Choose Student"
          href="/signup"
        />
        <PricingCard
          name="Pro"
          price={pro.amount}
          period={annual ? PLAN_PRICING.pro.annual.suffix : PLAN_PRICING.pro.monthly.suffix}
          subline={
            annual
              ? `${PLAN_PRICING.pro.annual.perMonth} · ${PLAN_PRICING.pro.annual.saving}`
              : undefined
          }
          features={[
            "Everything in Student",
            "Unlimited PDF exports",
            "Multi-page PDF export",
            "Up to 10 fonts + Spanish & French templates",
          ]}
          cta="Choose Pro"
          href="/signup"
        />
      </div>
    </>
  );
}

function PricingCard({
  name,
  price,
  period,
  subline,
  badge,
  features,
  cta,
  href,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  subline?: string;
  badge?: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        highlighted
          ? "border-terracotta/40 bg-white shadow-paper ring-1 ring-terracotta/20"
          : "border-ink/8 bg-white shadow-card"
      }`}
    >
      {highlighted && badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-terracotta px-3 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-semibold text-ink">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-ink">{price}</span>
        <span className="text-sm text-ink/50">{period}</span>
      </div>
      <p className="mt-1 h-4 text-xs font-medium text-terracotta-dark">
        {subline ?? ""}
      </p>
      <ul className="mt-4 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink/70">
            <span className="mt-0.5 text-terracotta">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <LinkButton
          href={href}
          variant={highlighted ? "primary" : "secondary"}
          className="w-full"
        >
          {cta}
        </LinkButton>
      </div>
    </div>
  );
}
