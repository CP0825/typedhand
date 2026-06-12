import Link from "next/link";
import { forwardRef } from "react";

type Variant =
  | "primary"
  | "action"
  | "secondary"
  | "dark-secondary"
  | "ghost"
  | "dark-ghost"
  | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-th-forest/50 focus-visible:ring-offset-2 focus-visible:ring-offset-th-canvas disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:        "bg-th-forest text-th-canvas hover:bg-th-forest/90",
  action:         "bg-th-amber text-th-void hover:bg-th-amber/90",
  secondary:      "border border-[0.5px] border-th-dusty text-th-ink hover:bg-th-parchment",
  "dark-secondary":"border border-[0.5px] border-th-editor-border text-th-editor-text hover:bg-th-surface-2",
  ghost:          "text-th-ink-mid hover:bg-th-parchment hover:text-th-ink",
  "dark-ghost":   "text-th-editor-muted hover:bg-th-surface-2 hover:text-th-editor-text",
  danger:         "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";

type LinkButtonProps = CommonProps &
  React.ComponentProps<typeof Link>;

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
