"use client";

import type { BillingInterval } from "@/lib/constants";

interface BillingToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  /** Optional small note shown next to "Annual" (e.g. "Save up to 51%"). */
  annualNote?: string;
}

// Segmented monthly / annual switch shared by the landing pricing section and
// the in-app upgrade flows.
export function BillingToggle({ value, onChange, annualNote }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-ink/12 bg-white p-1 text-sm">
      <button
        type="button"
        aria-pressed={value === "monthly"}
        onClick={() => onChange("monthly")}
        className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
          value === "monthly"
            ? "bg-ink text-paper"
            : "text-ink/55 hover:text-ink"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={value === "annual"}
        onClick={() => onChange("annual")}
        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition-colors ${
          value === "annual" ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
        }`}
      >
        Annual
        {annualNote && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              value === "annual"
                ? "bg-paper/20 text-paper"
                : "bg-terracotta/15 text-terracotta-dark"
            }`}
          >
            {annualNote}
          </span>
        )}
      </button>
    </div>
  );
}
