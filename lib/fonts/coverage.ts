// Human-readable summary of which characters a converted font actually covers,
// driven by the `codepoints` array stored per variant. Used in the dashboard so
// users understand that characters their sheet didn't include won't render
// (e.g. the free "standard" template has no digits).

function has(cps: Set<number>, ch: string): boolean {
  return cps.has(ch.codePointAt(0) as number);
}
function hasAll(cps: Set<number>, s: string): boolean {
  return [...s].every((ch) => has(cps, ch));
}
function hasAny(cps: Set<number>, s: string): boolean {
  return [...s].some((ch) => has(cps, ch));
}

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const PUNCT = "!\"'(),-.:;?@&%#+*=/";
const UMLAUTS = "äöüßÄÖÜ";
const ACCENTS = "àâçéèêëîôùÀÂÇÉÈÊ";

export interface Coverage {
  groups: string[]; // what it covers, e.g. ["A–Z", "a–z"]
  missing: string[]; // notable gaps, e.g. ["numbers"]
  hasDigits: boolean;
}

export function describeCoverage(codepoints: number[] | null): Coverage {
  const cps = new Set(codepoints ?? []);
  const groups: string[] = [];
  const missing: string[] = [];

  if (hasAll(cps, UPPER)) groups.push("A–Z");
  if (hasAll(cps, LOWER)) groups.push("a–z");

  const hasDigits = hasAll(cps, DIGITS);
  if (hasDigits) groups.push("0–9");
  else missing.push("numbers");

  if (hasAny(cps, PUNCT)) groups.push("punctuation");
  if (hasAny(cps, UMLAUTS)) groups.push("umlauts (ä ö ü ß)");
  if (hasAny(cps, ACCENTS)) groups.push("accents");

  if (!hasAny(cps, PUNCT)) missing.push("symbols");

  return { groups, missing, hasDigits };
}
