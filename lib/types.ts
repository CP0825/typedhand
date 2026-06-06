import type { Tier } from "./constants";

export interface Profile {
  id: string;
  email: string;
  tier: Tier;
  export_count: number;
  export_reset_date: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_admin: boolean;
  created_at: string;
  // Consent / age-gate (migration 006). Recorded at signup. Users under 16 are
  // hard-blocked, so there is no minor / parental-consent state; the raw date of
  // birth is never stored (only the derived confirmation flag).
  confirmed_age_16_plus: boolean;
  consent_version: string | null;
  consent_timestamp: string | null;
}

export interface ExportRecord {
  id: string;
  user_id: string;
  export_type: "png" | "pdf";
  font_used: string;
  created_at: string;
}

export type UserFontStatus = "uploaded" | "processing" | "ready" | "failed";

export interface UserFont {
  id: string;
  user_id: string;
  name: string;
  source_path: string | null;
  source_type: string | null;
  status: UserFontStatus;
  created_at: string;
  // Added in migration 003 (produced TTF + conversion metadata).
  font_path: string | null;
  glyph_count: number | null;
  layout: string | null;
  variant_index: number | null;
  job_id: string | null;
  codepoints: number[] | null;
  // Added in migration 007: the user must preview + approve a converted font
  // before the editor uses it for exports.
  approved: boolean;
}

export type FontJobStatus = "queued" | "processing" | "done" | "failed";

export interface FontJob {
  id: string;
  user_id: string;
  name: string;
  status: FontJobStatus;
  source_paths: string[];
  font_ids: string[];
  error: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
  // Migration 004: convert.py layout key (e.g. "template_3").
  template: string | null;
  // Migration 007: retry-backoff gate — when set, not re-claimed until then.
  next_attempt_at: string | null;
}
