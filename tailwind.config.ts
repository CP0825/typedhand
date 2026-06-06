import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#fafaf7",
        ink: "#1a1a1a",
        terracotta: {
          DEFAULT: "#b8765a",
          dark: "#a3654b",
          light: "#cf9c86",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        caveat: ["var(--font-caveat)", "cursive"],
        kalam: ["var(--font-kalam)", "cursive"],
        patrick: ["var(--font-patrick-hand)", "cursive"],
        dancing: ["var(--font-dancing-script)", "cursive"],
      },
      boxShadow: {
        paper: "0 10px 40px -12px rgba(26, 26, 26, 0.18)",
        card: "0 1px 3px rgba(26, 26, 26, 0.06), 0 1px 2px rgba(26, 26, 26, 0.04)",
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
