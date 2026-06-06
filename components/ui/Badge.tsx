import type { Tier } from "@/lib/constants";

const tierStyles: Record<Tier, string> = {
  free: "bg-ink/8 text-ink/70 ring-ink/10",
  student: "bg-terracotta/12 text-terracotta-dark ring-terracotta/25",
  pro: "bg-ink text-paper ring-ink",
};

const tierLabel: Record<Tier, string> = {
  free: "Free",
  student: "Student",
  pro: "Pro",
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
      className={`inline-flex items-center rounded-full bg-terracotta/12 px-2.5 py-0.5 text-xs font-semibold text-terracotta-dark ${className}`}
    >
      {children}
    </span>
  );
}
