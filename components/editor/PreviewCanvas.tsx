"use client";

import { forwardRef, useDeferredValue, useMemo } from "react";
import { getFont } from "@/lib/fonts";
import { rng, type EditorSettings } from "./types";

interface PreviewCanvasProps {
  settings: EditorSettings;
}

// Renders the live, exportable preview. The forwarded ref points at the exact
// node html2canvas/jsPDF will capture — what you see is what you export.
export const PreviewCanvas = forwardRef<HTMLDivElement, PreviewCanvasProps>(
  function PreviewCanvas({ settings }, ref) {
    // The pool of handwriting variants. When the user has uploaded their own
    // fonts those become the whole pool — each letter is drawn from a random
    // one of THEIR samples (true per-letter randomness). Otherwise we use
    // Constantin's 12 built-in handwriting samples.
    const pool = useMemo<string[]>(() => {
      if (settings.customFontFamilies.length > 0) {
        return settings.customFontFamilies.map((f) => `'${f}'`);
      }
      return getFont(settings.fontId).variants;
    }, [settings.customFontFamilies, settings.fontId]);

    // Defer the expensive inputs so fast typing / dragging never blocks the UI.
    // Container styling (font-size, spacing…) stays instant since it's cheap.
    const deferredText = useDeferredValue(settings.text);
    const deferredMessiness = useDeferredValue(settings.messiness);
    const deferredSeed = useDeferredValue(settings.seed);

    // ── Handwriting layer: one span per character ───────────────────────────
    // For every character we randomly pick a variant from the pool (seeded), so
    // the same letter is drawn from a different sample each time — the core
    // trick from index(3).html. Memoised on only the inputs that change the
    // glyph layout, so moving the size/spacing sliders is free.
    const handwriting = useMemo(() => {
      const seed = deferredSeed;
      const intensity = deferredMessiness / 100;
      const poolLen = pool.length;
      let charIndex = 0;

      return deferredText.split("\n").map((line, lineIdx) => (
        <span key={lineIdx} className="block min-h-[1em]">
          {Array.from(line).map((ch, i) => {
            const idx = charIndex++;
            if (ch === " ") return <span key={i}> </span>;

            // Random variant for this character.
            const variant = pool[Math.floor(rng(seed, idx, 10) * poolLen)];

            // Organic per-character jitter, scaled by messiness.
            const rotate = (rng(seed, idx, 1) - 0.5) * 6 * intensity;
            const tx = (rng(seed, idx, 2) - 0.5) * 4 * intensity;
            const ty = (rng(seed, idx, 3) - 0.5) * 4 * intensity;
            const sizeVar = 1 + (rng(seed, idx, 4) - 0.5) * 0.12 * intensity;

            return (
              <span
                key={i}
                className="inline-block"
                style={{
                  fontFamily: `${variant}, cursive`,
                  transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg) scale(${sizeVar})`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ));
    }, [deferredText, deferredMessiness, deferredSeed, pool]);

    const amount = Math.min(100, Math.max(0, settings.handwrittenAmount)) / 100;
    const showComputer = amount < 1;
    const showHand = amount > 0;

    const baseStyle = {
      fontSize: `${settings.fontSize}px`,
      letterSpacing: `${settings.letterSpacing}px`,
      lineHeight: settings.lineHeight,
      whiteSpace: "pre-wrap" as const,
      wordBreak: "break-word" as const,
    };

    const isEmpty = settings.text.trim().length === 0;

    return (
      <div
        ref={ref}
        className="paper-lines mx-auto grid w-full bg-th-parchment px-[7%] py-[9%] text-th-ink"
        style={{ aspectRatio: "210 / 297", overflow: "hidden" }}
      >
        {isEmpty ? (
          <span className="text-th-ink-light" style={baseStyle}>
            Start typing to see your handwriting…
          </span>
        ) : (
          <>
            {/* Computer-text layer. Fades out as the slider moves to hand. */}
            {showComputer && (
              <div
                className="[grid-area:1/1]"
                style={{
                  ...baseStyle,
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  opacity: 1 - amount,
                }}
              >
                {settings.text}
              </div>
            )}
            {/* Handwriting layer. Fades in toward 100%. */}
            {showHand && (
              <div
                className="[grid-area:1/1]"
                style={{ ...baseStyle, opacity: amount }}
              >
                {handwriting}
              </div>
            )}
          </>
        )}
      </div>
    );
  },
);
