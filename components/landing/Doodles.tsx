import type { CSSProperties } from "react";

// Hand-drawn SVG doodles for the landing page. All strokes carry
// pathLength={1} so the .doodle-draw CSS (stroke-dasharray trick) can animate
// them drawing themselves in. Server-renderable — zero JS shipped.

interface DoodleProps {
  className?: string;
  /** Delay before the stroke draws itself in, e.g. "0.8s". */
  drawDelay?: string;
}

function doodleStyle(drawDelay?: string): CSSProperties | undefined {
  return drawDelay
    ? ({ "--draw-delay": drawDelay } as CSSProperties)
    : undefined;
}

/* Wavy marker underline, used under the hero headline. */
export function SquiggleUnderline({ className = "", drawDelay }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 220 24"
      fill="none"
      aria-hidden
      className={`doodle-draw ${className}`}
      style={doodleStyle(drawDelay)}
    >
      <path
        d="M5 15 C 38 5, 62 21, 98 12 S 158 4, 215 11"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
  );
}

/* Curved arrow, points from the hero copy toward the live demo. */
export function ArrowDoodle({ className = "", drawDelay }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 90 80"
      fill="none"
      aria-hidden
      className={`doodle-draw ${className}`}
      style={doodleStyle(drawDelay)}
    >
      <path
        d="M8 10 C 38 12, 62 28, 68 60"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        pathLength={1}
      />
      <path
        d="M52 52 L 69 64 L 78 45"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}

/* Four-point sparkle. */
export function SparkleDoodle({ className = "", drawDelay }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={`doodle-draw ${className}`}
      style={doodleStyle(drawDelay)}
    >
      <path
        d="M16 3 C 16.8 9.5, 18.5 13, 25 14 C 18.5 16, 16.8 18.5, 16 26 C 15.2 18.5, 13.5 16, 7 14 C 13.5 13, 15.2 9.5, 16 3 Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}

/* Cursive loop-de-loop flourish. */
export function LoopDoodle({ className = "", drawDelay }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 90 44"
      fill="none"
      aria-hidden
      className={`doodle-draw ${className}`}
      style={doodleStyle(drawDelay)}
    >
      <path
        d="M3 34 C 16 6, 38 2, 38 20 C 38 38, 14 40, 18 22 C 21 8, 52 10, 86 16"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
  );
}

/* Little paper plane with a dashed trail, for the final CTA. */
export function PlaneDoodle({ className = "", drawDelay }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 96 56"
      fill="none"
      aria-hidden
      className={`doodle-draw ${className}`}
      style={doodleStyle(drawDelay)}
    >
      <path
        d="M4 46 C 22 44, 34 38, 44 30"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 8"
        pathLength={1}
      />
      <path
        d="M50 28 L 90 8 L 74 34 L 62 30 L 60 40 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}
