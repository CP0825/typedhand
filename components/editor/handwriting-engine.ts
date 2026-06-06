// ─────────────────────────────────────────────────────────────────────────
// Handwriting engine — ported 1:1 from index(3).html
//
// Pure data + helpers shared by the studio component. The font family names
// (HW6…HW20) match the @font-face declarations in globals.css exactly, so the
// per-character eligibility map below works verbatim.
// ─────────────────────────────────────────────────────────────────────────

export type PaperType = "plain" | "lined" | "squared";
export type RotDirection = "none" | "left" | "right" | "both";
export type PageSizeId = "a4" | "letter" | "a5";

// A user's own generated handwriting variant (Pro "generate my font"). The
// editor writes ONLY with the user's hand when they have any: per character it
// picks among the variants that actually cover that code point, and falls back
// to the built-in HW pool only for characters none of their sheets contain.
export interface UserVariant {
  id: string;
  family: string; // unique @font-face family registered at runtime (e.g. UF_…)
  url: string; // signed URL to the TTF in the personal-fonts bucket
  codepoints: number[]; // Unicode code points this variant contains a glyph for
}

// Per-character font eligibility. Keyed by Unicode code point → list of the
// handwriting variants that contain a good-looking glyph for that character.
export const ELIG_MAP: Record<number, string[]> = {
  // control / space
  0: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17"],
  13: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17"],
  32: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17"],
  // numbers 0–9 (fonts 21–24 = HW14–HW17)
  48: ["HW14", "HW15", "HW16", "HW17"], 49: ["HW14", "HW15", "HW16", "HW17"],
  50: ["HW14", "HW15", "HW16", "HW17"], 51: ["HW14", "HW15", "HW16", "HW17"],
  52: ["HW14", "HW15", "HW16", "HW17"], 53: ["HW14", "HW15", "HW16", "HW17"],
  54: ["HW14", "HW15", "HW16", "HW17"], 55: ["HW14", "HW15", "HW16", "HW17"],
  56: ["HW14", "HW15", "HW16", "HW17"], 57: ["HW14", "HW15", "HW16", "HW17"],
  // Euro sign € — fonts 21–22 only (HW14, HW15)
  8364: ["HW14", "HW15"],
  // punctuation — HW6 (font 10) is punctuation-only, never used for letters
  33: ["HW6", "HW7"], 34: ["HW6", "HW7"],
  35: ["HW6"], 36: ["HW6"], 37: ["HW6"], 38: ["HW6"],
  39: ["HW6", "HW7"], 40: ["HW6"], 41: ["HW6"], 42: ["HW6"], 43: ["HW6"],
  44: ["HW6", "HW7"], 45: ["HW6"], 46: ["HW6", "HW7"], 47: ["HW6"],
  58: ["HW6", "HW7"], 59: ["HW6", "HW7"],
  60: ["HW6"], 61: ["HW6"], 62: ["HW6"], 63: ["HW6", "HW7"], 64: ["HW6"],
  91: ["HW6"], 92: ["HW6"], 93: ["HW6"], 94: ["HW6"], 95: ["HW6"], 96: ["HW6"],
  123: ["HW6"], 124: ["HW6"], 125: ["HW6"], 126: ["HW6"],
  171: ["HW6"], 187: ["HW6"],
  // uppercase A–Z
  65: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  66: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  67: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  68: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  69: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  70: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  71: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  72: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  73: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  74: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  75: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  76: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  77: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  78: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  79: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  80: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  81: ["HW7", "HW9"], // Q — only fonts 12/15 have proper uppercase Q
  82: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  83: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  84: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  85: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  86: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  87: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  88: ["HW7", "HW9"], // X — only fonts 12/15 have proper uppercase X
  89: ["HW7", "HW9"], // Y — only fonts 12/15 have proper uppercase Y
  90: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17"], // Z — fonts 30/31/32 excluded
  // lowercase a–z
  97: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  98: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  99: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  100: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  101: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  102: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  103: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  104: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  105: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  106: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  107: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  108: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  109: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  110: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  111: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  112: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  113: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  114: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  115: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  116: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  117: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  118: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  119: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  120: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17"], // x — fonts 30/31/32 excluded
  121: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17"], // y — fonts 30/31/32 excluded
  122: ["HW7", "HW9", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17"], // z — HW10 + fonts 30/31/32 excluded
  160: ["HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20"],
  // German umlauts + ß (font 12 / HW7 and font 15 / HW9 only)
  168: ["HW7"],
  196: ["HW7", "HW9"], // Ä
  214: ["HW7", "HW9"], // Ö
  220: ["HW7", "HW9"], // Ü
  223: ["HW7", "HW9"], // ß
  228: ["HW7", "HW9"], // ä
  246: ["HW7", "HW9"], // ö
  252: ["HW7", "HW9"], // ü
  // French accented letters — fonts 30/31/32 (HW18/HW19/HW20) only
  192: ["HW18", "HW19", "HW20"], // À
  194: ["HW18", "HW19", "HW20"], // Â
  198: ["HW18", "HW19", "HW20"], // Æ
  199: ["HW18", "HW19", "HW20"], // Ç
  200: ["HW18", "HW19", "HW20"], // È
  201: ["HW18", "HW19", "HW20"], // É
  202: ["HW18", "HW19", "HW20"], // Ê
  203: ["HW18", "HW19", "HW20"], // Ë
  206: ["HW18", "HW19", "HW20"], // Î
  207: ["HW18", "HW19", "HW20"], // Ï
  212: ["HW18", "HW19", "HW20"], // Ô
  217: ["HW18", "HW19", "HW20"], // Ù
  219: ["HW18", "HW19", "HW20"], // Û
  224: ["HW18", "HW19", "HW20"], // à
  226: ["HW18", "HW19", "HW20"], // â
  230: ["HW18", "HW19", "HW20"], // æ
  231: ["HW18", "HW19", "HW20"], // ç
  232: ["HW18", "HW19", "HW20"], // è
  233: ["HW18", "HW19", "HW20"], // é
  234: ["HW18", "HW19", "HW20"], // ê
  235: ["HW18", "HW19", "HW20"], // ë
  238: ["HW18", "HW19", "HW20"], // î
  239: ["HW18", "HW19", "HW20"], // ï
  244: ["HW18", "HW19", "HW20"], // ô
  249: ["HW18", "HW19", "HW20"], // ù
  251: ["HW18", "HW19", "HW20"], // û
  338: ["HW18", "HW19", "HW20"], // Œ
  339: ["HW18", "HW19", "HW20"], // œ
  // typographic dashes & quotes
  8208: ["HW6"], 8209: ["HW6"], 8210: ["HW6"], 8211: ["HW6"], 8212: ["HW6"],
  8213: ["HW6"], 8214: ["HW6"], 8215: ["HW6"],
  8216: ["HW6", "HW7"], 8217: ["HW6", "HW7"], 8218: ["HW6", "HW7"],
  8219: ["HW6"],
  8220: ["HW6", "HW7"], 8221: ["HW6", "HW7"], 8222: ["HW6", "HW7"],
  8223: ["HW6"], 8224: ["HW6"], 8225: ["HW6"], 8226: ["HW6"], 8227: ["HW6"],
  8228: ["HW6"], 8229: ["HW6"], 8230: ["HW6"], 8231: ["HW6"],
  8240: ["HW6"], 8241: ["HW6"], 8242: ["HW6"], 8243: ["HW6"], 8244: ["HW6"],
  8245: ["HW6"], 8246: ["HW6"], 8247: ["HW6"], 8248: ["HW6"],
  8249: ["HW6"], 8250: ["HW6"],
};

// Letters-only pool — HW6 is punctuation-only and added per-glyph via ELIG_MAP.
export const ALL_IDS = [
  "HW7", "HW9", "HW10", "HW11", "HW12", "HW14", "HW15", "HW16", "HW17", "HW18", "HW19", "HW20",
];

// Page size definitions (mm)
export const PAGE_SIZES: Record<PageSizeId, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
  a5: { w: 148, h: 210 },
};

export const LINE_COLOR = "#d0d2d3"; // fixed GoodNotes line colour

// ── PRNG (mulberry32) — identical stream to index(3).html ──────────────────
export function mulberry32(seed: number): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
