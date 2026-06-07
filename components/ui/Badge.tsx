import type { Tier } from "@/lib/constants";

const tierStyles: Record<Tier, string> = {
  free:    "bg-th-ink/8 text-th-ink-mid ring-th-ink/10",
  student: "bg-th-forest/12 text-th-forest ring-th-forest/25",
  pro:     "bg-th-ink text-th-canvas ring-th-ink",
};

const tierLabel: Record<Tier, string> = {
  free:    "Free",
  student: "Student",
  pro:     "Pro",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${tierStyles[tier]}`}
    >
      {tierLabel[tier]}
    </span>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-th-forest/12 px-2.5 py-0.5 text-xs font-semibold text-th-forest ${className}`}
    >
      {children}
    </span>
  );
}
