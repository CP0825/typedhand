"use client";

import { useMemo, useState } from "react";
import { HANDWRITING_FONTS, HANDWRITING_VARIANTS } from "@/lib/fonts";
import { seededJitter, rng } from "@/components/editor/types";

// Above-the-fold live demo: type on the left, see it rendered as handwriting on
// the right. The demo uses a sample hand for illustration; in the app you write
// in your own uploaded handwriting.
export function HeroDemo() {
  const [text, setText] = useState(
    "Canada has more lakes than all other countries combined.",
  );
  const [fontIdx, setFontIdx] = useState(0);
  const font = HANDWRITING_FONTS[fontIdx];

  const rendered = useMemo(() => {
    let idx = 0;
    return Array.from(text).map((ch, i) => {
      if (ch === " ") return <span key={i}> </span>;
      const id = idx++;
      const rotate = seededJitter(id, 1) * 3.5;
      const ty = seededJitter(id, 3) * 1.8;
      const variantIdx = Math.floor(rng(42, id, 7) * HANDWRITING_VARIANTS.length);
      return (
        <span
          key={i}
          className="inline-block"
          style={{
            transform: `translateY(${ty}px) rotate(${rotate}deg)`,
            fontFamily: HANDWRITING_VARIANTS[variantIdx],
          }}
        >
          {ch}
        </span>
      );
    });
  }, [text]);

  return (
    <div className="rounded-2xl border border-th-dusty/50 bg-th-canvas p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <span className="mb-2 text-xs font-medium uppercase tracking-wide text-th-ink-light">
            You type
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="flex-1 resize-none rounded-xl border border-th-dusty bg-th-canvas p-3 text-sm text-th-ink outline-none focus:border-th-forest/50"
            aria-label="Demo text"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {HANDWRITING_FONTS.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setFontIdx(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  i === fontIdx
                    ? "bg-th-forest text-th-canvas"
                    : "bg-th-ink/5 text-th-ink-mid hover:bg-th-ink/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="mb-2 text-xs font-medium uppercase tracking-wide text-th-ink-light">
            We render
          </span>
          <div
            className="paper-lines flex-1 rounded-xl bg-th-canvas p-4 text-2xl leading-relaxed text-th-ink ring-1 ring-th-dusty/30"
            style={{ fontFamily: font.cssVar }}
          >
            {rendered}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-th-ink-light">
        Example shown in a sample hand — in the app, it&apos;s your own
        handwriting.
      </p>
    </div>
  );
}
