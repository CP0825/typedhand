"use client";

import { useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { BillingToggle } from "@/components/ui/BillingToggle";
import { Reveal } from "@/components/landing/Reveal";
import { PLAN_PRICING, type BillingInterval } from "@/lib/constants";

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
        <Reveal className="h-full">
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
        </Reveal>
        <Reveal delay={110} className="h-full">
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
        </Reveal>
        <Reveal delay={220} className="h-full">
        <PricingCard
          name="Pro"
          price={pro.amount}
          period={annual ? PLAN_PRICING.pro.annual.suffix : PLAN_PRICING.pro.monthly.suffix}
          subline={
            annual
              ? `${PLAN_PRICING.pro.annual.perMonth} · ${PLAN_PRICING.pro.annual.saving}`
              : undefined
          }
          dark
          features={[
            "Everything in Student",
            "30 PDF exports / month",
            "Multi-page PDF export",
            "Up to 10 fonts + Spanish & French templates",
          ]}
          cta="Choose Pro"
          href="/signup"
        />
        </Reveal>
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
  dark = false,
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
  dark?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1.5 ${
        dark
          ? "border-th-ink bg-th-ink shadow-xl hover:shadow-2xl"
          : highlighted
          ? "border-th-forest/40 bg-white shadow-[0_16px_40px_-20px_rgba(45,74,62,0.4)] ring-1 ring-th-forest/20 hover:shadow-[0_24px_48px_-20px_rgba(45,74,62,0.45)] md:scale-[1.03]"
          : "border-th-dusty/50 bg-white shadow-sm hover:shadow-lg"
      }`}
    >
      {highlighted && badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-th-forest px-3 py-0.5 text-xs font-semibold text-th-canvas">
          {badge}
        </span>
      )}
      {/* The Pro card is a deliberate dark accent card, so its text colours
          are explicit light-on-dark (the th-editor-* tokens are light now). */}
      <h3 className={`text-lg font-semibold ${dark ? "text-th-canvas" : "text-th-ink"}`}>
        {name}
      </h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${dark ? "text-th-canvas" : "text-th-ink"}`}>
          {price}
        </span>
        <span className={`text-sm ${dark ? "text-th-canvas/65" : "text-th-ink-mid"}`}>
          {period}
        </span>
      </div>
      <p className={`mt-1 h-4 text-xs font-medium ${dark ? "text-[#d9a13d]" : "text-th-forest"}`}>
        {subline ?? ""}
      </p>
      <ul className="mt-4 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className={`flex items-start gap-2 text-sm ${dark ? "text-th-canvas/65" : "text-th-ink-mid"}`}>
            <span className={`mt-0.5 ${dark ? "text-[#d9a13d]" : "text-th-forest"}`}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <LinkButton
          href={href}
          variant={dark ? "action" : highlighted ? "primary" : "secondary"}
          className="w-full"
        >
          {cta}
        </LinkButton>
      </div>
    </div>
  );
}
