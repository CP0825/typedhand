// Centralised, type-safe access to public app configuration.
// These read from NEXT_PUBLIC_* vars which are inlined at build time, so they
// are safe to import in both client and server components.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "TypedHand";
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "typedhand.com";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Single source of truth for the watermark stamped onto free-tier exports.
export const WATERMARK_TEXT = `Made with ${APP_NAME} • ${APP_DOMAIN}`;

// Consent version recorded at signup. Bump whenever the Terms / Privacy Policy
// change materially, so a re-consent flow can detect users who accepted an
// older version.
// TODO(constantin): bump this whenever /agb or /datenschutz change materially.
export const CONSENT_VERSION = "2025-v1";

// Germany's digital-consent age under Art. 8 DSGVO. Users below this are
// hard-blocked from signing up (server-side validated).
export const MIN_SIGNUP_AGE = 16;

export type Tier = "free" | "student" | "pro";

export const PRICING = {
  free: {
    name: "Free",
    price: "€0",
    period: "forever",
    exportLimit: Infinity,
  },
  student: {
    // Internal tier key stays "student" (Stripe price IDs, DB); the customer-
    // facing label is "Plus".
    name: "Plus",
    price: "€2.99",
    period: "/month",
    exportLimit: Infinity,
  },
  pro: {
    name: "Pro",
    price: "€5.99",
    period: "/month",
    exportLimit: Infinity,
  },
} as const;

// Billing interval for paid plans. "monthly" uses the existing Stripe price IDs;
// "annual" uses the new STRIPE_PRICE_ID_*_ANNUAL ids (see lib/stripe/client.ts).
export type BillingInterval = "monthly" | "annual";

// Paid-plan pricing shown by the monthly/annual toggle. Annual figures include
// the per-month equivalent and the saving vs paying monthly:
//   Student: €2.99/mo × 12 = €35.88 → €19.99/yr saves €15.89 (~44%)
//   Pro:     €5.99/mo × 12 = €71.88 → €34.99/yr saves €36.89 (~51%)
export const PLAN_PRICING = {
  student: {
    monthly: { amount: "€2.99", suffix: "/mo" },
    annual: {
      amount: "€19.99",
      suffix: "/yr",
      perMonth: "€1.67/mo",
      saving: "Save €15.89 (44%)",
      recommended: true,
    },
  },
  pro: {
    monthly: { amount: "€5.99", suffix: "/mo" },
    annual: {
      amount: "€34.99",
      suffix: "/yr",
      perMonth: "€2.92/mo",
      saving: "Save €36.89 (51%)",
      recommended: false,
    },
  },
} as const;
