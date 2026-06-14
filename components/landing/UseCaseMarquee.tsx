import { HandwrittenText } from "@/components/landing/HandwrittenText";

const ITEMS = [
  "love letters",
  "lecture notes",
  "flashcards",
  "penpal letters",
  "gift tags",
  "study guides",
  "accessible writing",
  "journal pages",
  "thank-you cards",
  "party invites",
  "recipe cards",
];

// Scrolling strip of use-cases rendered in the real handwriting variants.
// Server component, pure CSS animation, and the fonts are already loaded for
// the hero demo — so this costs nothing extra.
export function UseCaseMarquee() {
  // Two identical copies inside one track; CSS slides it -50% and loops.
  const copy = (ariaHidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {ITEMS.map((item, i) => (
        <span key={item} className="flex items-center">
          {/* Each phrase mixes the whole handwriting pool per character, so it
              reads as real handwriting rather than one uniform font. */}
          <HandwrittenText
            text={item}
            seed={i + 1}
            jitter
            className="px-6 text-2xl text-th-ink-mid sm:text-3xl"
            style={{ transform: `rotate(${i % 2 === 0 ? -1.2 : 1.2}deg)` }}
          />
          {/* Separator stays in the UI font — the handwriting fonts don't
              necessarily carry this glyph. */}
          <span className="text-xs text-th-forest/40">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee border-y border-th-dusty/40 bg-th-parchment/40 py-4">
      <div className="marquee-track">
        {copy(false)}
        {copy(true)}
      </div>
    </div>
  );
}
