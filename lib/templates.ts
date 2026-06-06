import type { Tier } from "./constants";

// ---------------------------------------------------------------------------
// Handwriting templates
// ---------------------------------------------------------------------------
// TypedHand issues a fixed set of Calligraphr sheets — users never craft their
// own — so the cell -> Unicode mapping is known exactly. The `layout` key here
// matches a layout in font-worker/convert.py (LAYOUTS), and is what we send the
// worker so it maps glyphs to code points directly (no QR decode / OCR).
//
// Tier access (per product spec):
//   free    -> template 3 only (and only one upload — enforced by fontLimit=1)
//   student -> templates 1, 3, 4
//   pro     -> all five (2 = Spanish, 5 = French are Pro-only)
// ---------------------------------------------------------------------------

export type TemplateId =
  | "template-1"
  | "template-2"
  | "template-3"
  | "template-4"
  | "template-5";

export interface FontTemplate {
  id: TemplateId;
  /** convert.py LAYOUTS key passed to the worker. */
  layout: string;
  /** Public download path (file in /public/templates). */
  file: string;
  /** Short title shown in the picker. */
  label: string;
  /** One-line description of what the sheet covers. */
  description: string;
  /** Tiers allowed to download/upload this template. */
  tiers: Tier[];
}

export const FONT_TEMPLATES: FontTemplate[] = [
  {
    id: "template-3",
    layout: "template_3",
    file: "/templates/template-3.pdf",
    label: "Standard (no numbers)",
    description:
      "The standard template — all letters, German umlauts and punctuation, but without numbers.",
    tiers: ["free", "student", "pro"],
  },
  {
    id: "template-1",
    layout: "template_1",
    file: "/templates/template-1.pdf",
    label: "Essential letters",
    description:
      "Only the most important letters (lowercase a–z plus ä, ö, ü, ß). Quickest to fill in.",
    tiers: ["student", "pro"],
  },
  {
    id: "template-4",
    layout: "template_4",
    file: "/templates/template-4.pdf",
    label: "Symbols & numbers",
    description:
      "Adds the special characters and numbers (0–9, punctuation, @, %, & …).",
    tiers: ["student", "pro"],
  },
  {
    id: "template-2",
    layout: "template_2",
    file: "/templates/template-2.pdf",
    label: "Spanish",
    description:
      "Spanish character set (¿ ¡ ñ á é í ó ú …) on top of the full alphabet.",
    tiers: ["pro"],
  },
  {
    id: "template-5",
    layout: "template_5",
    file: "/templates/template-5.pdf",
    label: "French",
    description:
      "French character set (à â ç é è ê ë î ô ù « » …) on top of the full alphabet.",
    tiers: ["pro"],
  },
];

/** All templates a tier may download/upload, in display order. */
export function getTemplatesForTier(tier: Tier): FontTemplate[] {
  return FONT_TEMPLATES.filter((t) => t.tiers.includes(tier));
}

/** Look up a template by id. */
export function getTemplate(id: string): FontTemplate | undefined {
  return FONT_TEMPLATES.find((t) => t.id === id);
}

/** Reverse lookup by convert.py layout key (e.g. "template_3"), as stored on a
 * font job — used to preselect the right template for a re-upload after failure. */
export function getTemplateByLayout(layout: string | null): FontTemplate | undefined {
  if (!layout) return undefined;
  return FONT_TEMPLATES.find((t) => t.layout === layout);
}

/** Whether a tier is allowed to use a given template id. */
export function canUseTemplate(tier: Tier, id: string): boolean {
  const t = getTemplate(id);
  return !!t && t.tiers.includes(tier);
}

/**
 * Per-tier guidance on how many sheets to upload for the best result.
 * (Each uploaded sheet becomes one variant; the editor mixes variants per
 * character, so repeating the everyday letters gives a more natural look.)
 */
export function uploadRecommendation(tier: Tier): string | null {
  if (tier === "student") {
    return "For the most natural result, upload the “Essential letters” sheet three times, and the other two templates once each.";
  }
  if (tier === "pro") {
    return "For the best results, upload the “Essential letters” sheet most often — repeat it several times, and add the other templates as needed.";
  }
  return null;
}
