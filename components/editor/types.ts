import type { HandwritingFontId } from "@/lib/fonts";

export interface EditorSettings {
  text: string;
  fontId: HandwritingFontId;
  fontSize: number; // px, 12–36
  letterSpacing: number; // px, -2–8
  lineHeight: number; // 1.0–2.5
  messiness: number; // 0–100
  pressure: number; // font-weight 300–600 (legacy; kept for type stability)
  // 0 = plain computer text, 100 = fully handwritten. Crossfades between them.
  handwrittenAmount: number;
  // Re-rolled by the Randomise button; drives which variant each char uses.
  seed: number;
  // User-uploaded font family names (registered via FontFace). When non-empty
  // the preview draws each letter from a RANDOM one of these — true per-letter
  // randomness across the user's own multiple uploaded samples.
  customFontFamilies: string[];
}

export const DEFAULT_SETTINGS: EditorSettings = {
  text: "Dear Grandma,\n\nThank you so much for the birthday card and the lovely note — it made my whole week. I wanted to write back to you by hand.\n\nWith love,\nAlex",
  fontId: "myhand",
  fontSize: 22,
  letterSpacing: -1,
  lineHeight: 1.6,
  messiness: 28,
  pressure: 400,
  handwrittenAmount: 100,
  seed: 1234567,
  customFontFamilies: [],
};

// ── Deterministic PRNG (mulberry32) — same engine as index(3).html ──────────
// Seeded by char index + a salt so every re-render is identical, yet pressing
// "Randomise" (new seed) reshuffles which variant each letter is drawn from.
function mulberry32(seed: number): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// rng(seed, index, slot) → float in [0, 1). Mirrors index(3).html's rng().
export function rng(seed: number, index: number, slot: number): number {
  return mulberry32(
    (seed ^ (index * 2654435761) ^ (slot * 1234567891)) | 0,
  );
}

// Convenience: deterministic value in [-1, 1].
export function seededJitter(index: number, salt: number): number {
  return rng(0, index, salt) * 2 - 1;
}
