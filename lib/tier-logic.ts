import type { Tier } from "./constants";
import { PRICING } from "./constants";

// PDF is now the only export format (PNG was removed). The single remaining
// differentiator between tiers is the monthly export count; multi-page PDF
// stays a Pro perk and the free tier keeps a watermark.
export type ExportType = "pdf";

export interface TierCapabilities {
  exportLimit: number; // Infinity for unlimited (Pro)
  fontLimit: number; // max handwriting fonts a user may upload
  allowMultiPagePdf: boolean; // Pro-only; others get a single-page PDF
  watermark: boolean;
}

export const TIER_CAPABILITIES: Record<Tier, TierCapabilities> = {
  free: {
    exportLimit: 1,
    fontLimit: 2,
    allowMultiPagePdf: false,
    watermark: true,
  },
  student: {
    // 5 sheets covers the recommended set: the essential-letters template ×3
    // plus the standard and symbols templates once each.
    exportLimit: 5,
    fontLimit: 5,
    allowMultiPagePdf: false,
    watermark: false,
  },
  pro: {
    exportLimit: 30,
    fontLimit: 10,
    allowMultiPagePdf: true,
    watermark: false, // Pro never carries a watermark
  },
};

export function getCapabilities(tier: Tier): TierCapabilities {
  return TIER_CAPABILITIES[tier] ?? TIER_CAPABILITIES.free;
}

/** Maximum handwriting fonts uploadable on a tier (free 1, student 5, pro 10). */
export function getFontLimit(tier: Tier): number {
  return getCapabilities(tier).fontLimit;
}

/**
 * Whether the export reset window has elapsed. Used both client-side (for
 * display) and server-side (to decide if the counter should roll over).
 */
export function isResetDue(resetDate: string | Date): boolean {
  return new Date(resetDate).getTime() <= Date.now();
}

/**
 * Computes the next monthly reset date from a given anchor (defaults to now).
 */
export function nextResetDate(from: Date = new Date()): Date {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export interface ExportEligibility {
  allowed: boolean;
  reason?: "limit_reached";
  remaining: number; // Infinity for unlimited
  watermark: boolean;
  multiPage: boolean;
}

/**
 * The single shared decision function for whether an export may proceed. Used
 * by the server route (authoritative) and mirrored in the UI for messaging.
 * With PNG gone, the only gate is the monthly export count.
 *
 * `effectiveCount` should already account for a pending monthly reset.
 */
export function evaluateExport(params: {
  tier: Tier;
  effectiveCount: number;
}): ExportEligibility {
  const caps = getCapabilities(params.tier);
  const remaining =
    caps.exportLimit === Infinity
      ? Infinity
      : Math.max(0, caps.exportLimit - params.effectiveCount);

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: "limit_reached",
      remaining: 0,
      watermark: caps.watermark,
      multiPage: caps.allowMultiPagePdf,
    };
  }

  return {
    allowed: true,
    remaining,
    watermark: caps.watermark,
    multiPage: caps.allowMultiPagePdf,
  };
}

/** Human-readable "used / limit" label, e.g. "3 / 5" or "12 / ∞". */
export function formatUsage(count: number, tier: Tier): string {
  const limit = PRICING[tier].exportLimit;
  return `${count} / ${limit === Infinity ? "∞" : limit}`;
}
