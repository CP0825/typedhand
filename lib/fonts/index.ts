import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";

// UI typeface
export const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

// ── The product font: Constantin's real handwriting ────────────────────────
// Exactly like index(3).html, the natural look comes from MANY scanned
// variants of the same alphabet. For every character we randomly pick one of
// these variant families, so the same letter is never drawn identically twice.
// Each .ttf below is one full handwritten sample of the alphabet.

export const hw1 = localFont({
  src: "../../fonts/Myfont12-Regular.ttf",
  variable: "--hw-1",
  display: "block",
});
export const hw2 = localFont({
  src: "../../fonts/Myfont15-Regular.ttf",
  variable: "--hw-2",
  display: "block",
});
export const hw3 = localFont({
  src: "../../fonts/Myfont16-Regular.ttf",
  variable: "--hw-3",
  display: "block",
});
export const hw4 = localFont({
  src: "../../fonts/Myfont17-Regular.ttf",
  variable: "--hw-4",
  display: "block",
});
export const hw5 = localFont({
  src: "../../fonts/Myfont18-Regular.ttf",
  variable: "--hw-5",
  display: "block",
});
export const hw6 = localFont({
  src: "../../fonts/Myfont21-Regular.ttf",
  variable: "--hw-6",
  display: "block",
});
export const hw7 = localFont({
  src: "../../fonts/Myfont22-Regular.ttf",
  variable: "--hw-7",
  display: "block",
});
export const hw8 = localFont({
  src: "../../fonts/Myfont23-Regular.ttf",
  variable: "--hw-8",
  display: "block",
});
export const hw9 = localFont({
  src: "../../fonts/Myfont24-Regular.ttf",
  variable: "--hw-9",
  display: "block",
});
export const hw10 = localFont({
  src: "../../fonts/Myfont30-Regular.ttf",
  variable: "--hw-10",
  display: "block",
});
export const hw11 = localFont({
  src: "../../fonts/Myfont31-Regular.ttf",
  variable: "--hw-11",
  display: "block",
});
export const hw12 = localFont({
  src: "../../fonts/Myfont32-Regular.ttf",
  variable: "--hw-12",
  display: "block",
});

// Every CSS variable that holds one handwriting variant. The renderer picks
// among these per character to reproduce the index(3).html randomisation.
export const HANDWRITING_VARIANTS: string[] = [
  "var(--hw-1)",
  "var(--hw-2)",
  "var(--hw-3)",
  "var(--hw-4)",
  "var(--hw-5)",
  "var(--hw-6)",
  "var(--hw-7)",
  "var(--hw-8)",
  "var(--hw-9)",
  "var(--hw-10)",
  "var(--hw-11)",
  "var(--hw-12)",
];

const hwVariableClasses = [
  hw1,
  hw2,
  hw3,
  hw4,
  hw5,
  hw6,
  hw7,
  hw8,
  hw9,
  hw10,
  hw11,
  hw12,
].map((f) => f.variable);

// Combined className applied to <html> so every CSS variable is available.
export const fontVariables = [dmSans.variable, ...hwVariableClasses].join(" ");

export type HandwritingFontId = "myhand";

export interface HandwritingFont {
  id: HandwritingFontId;
  label: string;
  // Representative family used for static previews (the selector chip, hero).
  cssVar: string;
  // All variant families. The editor randomises across these per character.
  variants: string[];
  // Kept for backward-compat with components that style by class name.
  className: string;
}

export const HANDWRITING_FONTS: HandwritingFont[] = [
  {
    id: "myhand",
    label: "My Handwriting",
    cssVar: HANDWRITING_VARIANTS[0],
    variants: HANDWRITING_VARIANTS,
    className: "",
  },
];

export function getFont(id: HandwritingFontId): HandwritingFont {
  return HANDWRITING_FONTS.find((f) => f.id === id) ?? HANDWRITING_FONTS[0];
}
