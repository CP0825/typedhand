"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HANDWRITING_FONTS, HANDWRITING_VARIANTS } from "@/lib/fonts";
import { seededJitter, rng } from "@/components/editor/types";

const SAMPLE = "Canada has more lakes than all other countries combined.";

const INKS = [
  { id: "blue", label: "Ink blue", color: "#1d3a8f" },
  { id: "black", label: "Black", color: "#1c1917" },
  { id: "forest", label: "Forest green", color: "#2d4a3e" },
];

// Above-the-fold live demo: type on the left, see it rendered as handwriting
// on the right. Auto-types a sample sentence on load (until the visitor
// touches it), and exposes two real editor controls — ink colour and
// messiness — so the hero is playable, not a screenshot. The demo uses a
// sample hand; in the app you write in your own uploaded handwriting.
export function HeroDemo() {
  const [text, setText] = useState("");
  const [ink, setInk] = useState(INKS[0]);
  const [mess, setMess] = useState(1);
  const [autoTyping, setAutoTyping] = useState(true);
  const interacted = useRef(false);
  const font = HANDWRITING_FONTS[0];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(SAMPLE);
      setAutoTyping(false);
      return;
    }
    let i = 0;
    const t = window.setInterval(() => {
      if (interacted.current) {
        window.clearInterval(t);
        return;
      }
      i++;
      setText(SAMPLE.slice(0, i));
      if (i >= SAMPLE.length) {
        window.clearInterval(t);
        setAutoTyping(false);
      }
    }, 45);
    return () => window.clearInterval(t);
  }, []);

  const stopAutoType = () => {
    interacted.current = true;
    setAutoTyping(false);
  };

  const rendered = useMemo(() => {
    // Words stay atomic (whitespace-nowrap) so lines never break mid-word —
    // same treatment as the real editor's span.word.
    let id = 0;
    return text.split(/(\s+)/).map((token, ti) => {
      if (!token) return null;
      if (/^\s+$/.test(token)) {
        return token.includes("\n") ? <br key={ti} /> : <span key={ti}> </span>;
      }
      return (
        <span key={ti} className="inline-block whitespace-nowrap">
          {Array.from(token).map((ch, ci) => {
            const i = id++;
            const rotate = seededJitter(i, 1) * 3.5 * mess;
            const ty = seededJitter(i, 3) * 1.8 * mess;
            const variantIdx = Math.floor(
              rng(42, i, 7) * HANDWRITING_VARIANTS.length,
            );
            return (
              <span
                key={ci}
                className="inline-block"
                style={{
                  transform: `translateY(${ty}px) rotate(${rotate}deg)`,
                  fontFamily: HANDWRITING_VARIANTS[variantIdx],
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      );
    });
  }, [text, mess]);

  return (
    <div className="rounded-2xl border border-th-dusty/50 bg-white p-4 shadow-[0_16px_48px_-16px_rgba(28,25,23,0.18)] sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <span className="mb-2 text-xs font-medium uppercase tracking-wide text-th-ink-light">
            You type
          </span>
          <textarea
            value={text}
            onChange={(e) => {
              stopAutoType();
              setText(e.target.value);
            }}
            onFocus={stopAutoType}
            rows={4}
            className="flex-1 resize-none rounded-xl border border-th-dusty/70 bg-th-canvas p-3 text-sm text-th-ink outline-none transition-colors focus:border-th-forest/60"
            aria-label="Demo text"
          />
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {INKS.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setInk(i)}
                  aria-label={`${i.label} ink`}
                  aria-pressed={i.id === ink.id}
                  className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                    i.id === ink.id
                      ? "ring-2 ring-th-forest ring-offset-2 ring-offset-white"
                      : "ring-1 ring-th-dusty/60"
                  }`}
                  style={{ backgroundColor: i.color }}
                />
              ))}
            </div>
            <label className="flex flex-1 items-center gap-2 text-xs font-medium text-th-ink-light">
              Messy
              <input
                type="range"
                min={0}
                max={2.5}
                step={0.1}
                value={mess}
                onChange={(e) => setMess(Number(e.target.value))}
                className="min-w-0 flex-1"
                aria-label="Messiness"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-th-ink-light">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-th-forest/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-th-forest" />
            </span>
            We render — live
          </span>
          <div className="relative flex-1">
            {/* Tape strips: the rendered sheet reads as real paper. */}
            <span className="absolute -top-2 left-5 z-10 h-4 w-14 -rotate-3 rounded-[2px] bg-th-parchment/90 shadow-sm ring-1 ring-th-dusty/40" />
            <span className="absolute -top-2 right-5 z-10 h-4 w-14 rotate-2 rounded-[2px] bg-th-parchment/90 shadow-sm ring-1 ring-th-dusty/40" />
            <div
              className="paper-lines h-full min-h-[8rem] rotate-[0.6deg] rounded-xl bg-th-canvas p-4 text-2xl leading-relaxed shadow-[0_8px_24px_-10px_rgba(28,25,23,0.25)] ring-1 ring-th-dusty/30 transition-transform duration-300 hover:rotate-0"
              style={{ fontFamily: font.cssVar, color: ink.color }}
            >
              {rendered}
              {autoTyping && <span className="th-caret" aria-hidden />}
            </div>
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
