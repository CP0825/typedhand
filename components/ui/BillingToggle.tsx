"use client";

import type { BillingInterval } from "@/lib/constants";

interface BillingToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  /** Optional small note shown next to "Annual" (e.g. "Save up to 51%"). */
  annualNote?: string;
}

export function BillingToggle({ value, onChange, annualNote }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-th-dusty bg-th-canvas p-1 text-sm">
      <button
        type="button"
        aria-pressed={value === "monthly"}
        onClick={() => onChange("monthly")}
        className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
          value === "monthly"
            ? "bg-th-ink text-th-canvas"
            : "text-th-ink-mid hover:text-th-ink"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={value === "annual"}
        onClick={() => onChange("annual")}
        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition-colors ${
          value === "annual"
            ? "bg-th-ink text-th-canvas"
            : "text-th-ink-mid hover:text-th-ink"
        }`}
      >
        Annual
        {annualNote && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              value === "annual"
                ? "bg-th-canvas/20 text-th-canvas"
                : "bg-th-forest/15 text-th-forest"
            }`}
          >
            {annualNote}
          </span>
        )}
      </button>
    </div>
  );
}
