import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta text-lg font-bold text-white">
          ✎
        </span>
        <span className="text-lg font-bold tracking-tight text-ink">
          {APP_NAME}
        </span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-ink/8 bg-white p-7 shadow-card">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink/60">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>

      {footer && <div className="mt-5 text-sm text-ink/60">{footer}</div>}
    </main>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-xl border border-ink/15 bg-paper px-3.5 text-sm text-ink outline-none focus:border-terracotta/60"
        {...props}
      />
    </label>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export function FormNotice({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-terracotta/10 px-3 py-2 text-sm text-terracotta-dark">
      {message}
    </p>
  );
}
