import { Fragment } from "react";
import { HANDWRITING_VARIANTS } from "@/lib/fonts";
import { rng, seededJitter } from "@/components/editor/types";

interface HandwrittenTextProps {
  text: string;
  // Changes which variant each character lands on, so two copies of the same
  // phrase don't look identical. Keep it stable per usage for hydration safety.
  seed?: number;
  // Adds the same per-character vertical wobble + rotation the real editor uses.
  jitter?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Renders a string in the product's real handwriting, picking a DIFFERENT
// variant for every character from the full pool — the same per-glyph
// randomisation the editor does — so static previews look hand-written rather
// than like a single uniform font. Pure + deterministic (seeded), so it renders
// the same on the server and the client (no hydration mismatch).
export function HandwrittenText({
  text,
  seed = 1,
  jitter = false,
  className,
  style,
}: HandwrittenTextProps) {
  let glyph = 0;
  return (
    <span className={className} style={style}>
      {Array.from(text).map((ch, idx) => {
        if (ch === " ") return <Fragment key={idx}> </Fragment>;
        const k = glyph++;
        const family =
          HANDWRITING_VARIANTS[
            Math.floor(rng(seed, k, 7) * HANDWRITING_VARIANTS.length)
          ];
        return (
          <span
            key={idx}
            className="inline-block"
            style={{
              fontFamily: family,
              transform: jitter
                ? `translateY(${(seededJitter(k, 3) * 1.2).toFixed(2)}px) rotate(${(
                    seededJitter(k, 1) * 2.4
                  ).toFixed(2)}deg)`
                : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}
