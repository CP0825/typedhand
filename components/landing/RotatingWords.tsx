"use client";

import { useEffect, useState } from "react";
import { HANDWRITING_VARIANTS } from "@/lib/fonts";
import { seededJitter, rng } from "@/components/editor/types";

const WORDS = [
  "love letters",
  "lecture notes",
  "flashcards",
  "thank-you cards",
  "journal pages",
  "party invites",
];

// Hero accent line: types and erases use-cases in the handwriting font, each
// character drawn from a random variant with a little jitter — the same trick
// the real editor uses, so the headline is a truthful product demo.
export function RotatingWords() {
  const [wordIdx, setWordIdx] = useState(0);
  const [len, setLen] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setLen(WORDS[0].length);
    }
  }, []);

  useEffect(() => {
    if (reduced) return;
    const full = WORDS[wordIdx].length;
    let t: number;
    if (!deleting && len < full) {
      t = window.setTimeout(() => setLen(len + 1), 70);
    } else if (!deleting) {
      t = window.setTimeout(() => setDeleting(true), 1800);
    } else if (len > 0) {
      t = window.setTimeout(() => setLen(len - 1), 32);
    } else {
      t = window.setTimeout(() => {
        setDeleting(false);
        setWordIdx((wordIdx + 1) % WORDS.length);
      }, 300);
    }
    return () => window.clearTimeout(t);
  }, [len, deleting, wordIdx, reduced]);

  const shown = WORDS[wordIdx].slice(0, len);

  return (
    <span className="inline-flex items-baseline whitespace-nowrap text-th-forest">
      <span className="text-[1.4em] leading-none">
        {Array.from(shown).map((ch, i) =>
          ch === " " ? (
            <span key={`${wordIdx}-${i}`}>&nbsp;</span>
          ) : (
            <span
              key={`${wordIdx}-${i}`}
              className="inline-block"
              style={{
                transform: `translateY(${seededJitter(i, 3) * 1.6}px) rotate(${
                  seededJitter(i, 1) * 3
                }deg)`,
                fontFamily:
                  HANDWRITING_VARIANTS[
                    Math.floor(
                      rng(7, i, wordIdx) * HANDWRITING_VARIANTS.length,
                    )
                  ],
              }}
            >
              {ch}
            </span>
          ),
        )}
      </span>
      {!reduced && <span className="th-caret" aria-hidden />}
    </span>
  );
}
