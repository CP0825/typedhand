"use client";

import { useMemo, useState } from "react";
import { HANDWRITING_FONTS } from "@/lib/fonts";
import { seededJitter } from "@/components/editor/types";

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
      const rotate = seededJitter(id, 1) * 2.4;
      const ty = seededJitter(id, 3) * 1.6;
      return (
        <span
          key={i}
          className="inline-block"
          style={{ transform: `translateY(${ty}px) rotate(${rotate}deg)` }}
        >
          {ch}
        </span>
      );
    });
  }, [text]);

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-paper sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <span className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/40">
            You type
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="flex-1 resize-none rounded-xl border border-ink/12 bg-paper p-3 text-sm text-ink outline-none focus:border-terracotta/50"
            aria-label="Demo text"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {HANDWRITING_FONTS.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setFontIdx(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  i === fontIdx
                    ? "bg-terracotta text-white"
                    : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/40">
            We render
          </span>
          <div
            className="paper-lines flex-1 rounded-xl bg-white p-4 text-2xl leading-relaxed text-ink ring-1 ring-ink/5"
            style={{ fontFamily: font.cssVar }}
          >
            {rendered}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink/40">
        Example shown in a sample hand — in the app, it&apos;s your own
        handwriting.
      </p>
    </div>
  );
}
