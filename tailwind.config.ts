import type { Config } from "tailwindcss";

// All colours are expressed as RGB channels so Tailwind can compose opacity
// modifiers (e.g. text-th-ink/55, bg-th-amber/10) at the call site.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Light-surface tokens (marketing / auth) ───────────────────────
        "th-canvas":      "rgb(250 249 247 / <alpha-value>)",  // #faf9f7
        "th-parchment":   "rgb(241 237 229 / <alpha-value>)",  // #f1ede5
        "th-dusty":       "rgb(201 195 184 / <alpha-value>)",  // #c9c3b8
        "th-ink":         "rgb(28 25 23 / <alpha-value>)",     // #1c1917
        "th-ink-mid":     "rgb(87 83 78 / <alpha-value>)",     // #57534e
        "th-ink-light":   "rgb(168 162 158 / <alpha-value>)",  // #a8a29e
        // ── Accent tokens ─────────────────────────────────────────────────
        "th-forest":      "rgb(45 74 62 / <alpha-value>)",     // #2d4a3e
        "th-amber":       "rgb(168 116 18 / <alpha-value>)",   // #a87412  (upgrade/pro accent, legible on white)
        // ── Editor / dashboard tokens — SAME light theme as the rest of the
        //    app. The whole site shares one white background (th-void ===
        //    th-canvas); these names are kept so existing call sites work.
        "th-void":        "rgb(250 249 247 / <alpha-value>)",  // #faf9f7 (= th-canvas)
        "th-surface":     "rgb(255 255 255 / <alpha-value>)",  // #ffffff (cards/panels)
        "th-surface-2":   "rgb(244 241 236 / <alpha-value>)",  // #f4f1ec (inset fields)
        "th-editor-border": "rgb(230 225 216 / <alpha-value>)",// #e6e1d8
        "th-editor-text": "rgb(28 25 23 / <alpha-value>)",     // #1c1917 (= th-ink)
        "th-editor-muted":"rgb(109 104 97 / <alpha-value>)",   // #6d6861
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        caveat: ["var(--font-caveat)", "cursive"],
        kalam: ["var(--font-kalam)", "cursive"],
        patrick: ["var(--font-patrick-hand)", "cursive"],
        dancing: ["var(--font-dancing-script)", "cursive"],
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
