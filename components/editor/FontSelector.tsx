"use client";

import { useEffect, useRef, useState } from "react";
import {
  HANDWRITING_FONTS,
  getFont,
  type HandwritingFontId,
} from "@/lib/fonts";

interface FontSelectorProps {
  value: HandwritingFontId;
  onChange: (id: HandwritingFontId) => void;
}

export function FontSelector({ value, onChange }: FontSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = getFont(value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1.5 block text-sm font-medium text-th-editor-muted">
        Font
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-th-editor-border bg-th-surface-2 px-3.5 text-left text-th-editor-text hover:border-th-editor-text/30"
      >
        <span className={`text-lg leading-none ${selected.className}`}>
          {selected.label}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`text-th-editor-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-th-editor-border bg-th-surface-2 py-1"
        >
          {HANDWRITING_FONTS.map((font) => (
            <li key={font.id}>
              <button
                type="button"
                role="option"
                aria-selected={font.id === value}
                onClick={() => {
                  onChange(font.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-th-editor-text hover:bg-th-surface ${
                  font.id === value ? "bg-th-surface" : ""
                }`}
              >
                <span className={`text-xl leading-none ${font.className}`}>
                  {font.label}
                </span>
                {font.id === value && (
                  <span className="text-th-amber">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
