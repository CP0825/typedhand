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
        "th-parchment":   "rgb(237 232 222 / <alpha-value>)",  // #ede8de
        "th-dusty":       "rgb(201 195 184 / <alpha-value>)",  // #c9c3b8
        "th-ink":         "rgb(28 25 23 / <alpha-value>)",     // #1c1917
        "th-ink-mid":     "rgb(87 83 78 / <alpha-value>)",     // #57534e
        "th-ink-light":   "rgb(168 162 158 / <alpha-value>)",  // #a8a29e
        // ── Accent tokens ─────────────────────────────────────────────────
        "th-forest":      "rgb(45 74 62 / <alpha-value>)",     // #2d4a3e  (light surfaces only)
        "th-amber":       "rgb(212 150 42 / <alpha-value>)",   // #d4962a  (dark surfaces only)
        // ── Dark-surface tokens (editor / dashboard) ───────────────────────
        "th-void":        "rgb(15 14 12 / <alpha-value>)",     // #0f0e0c
        "th-surface":     "rgb(26 25 22 / <alpha-value>)",     // #1a1916
        "th-surface-2":   "rgb(37 35 32 / <alpha-value>)",     // #252320
        "th-editor-border": "rgb(48 46 42 / <alpha-value>)",   // #302e2a
        "th-editor-text": "rgb(240 236 228 / <alpha-value>)",  // #f0ece4
        "th-editor-muted":"rgb(158 154 147 / <alpha-value>)",  // #9e9a93
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
