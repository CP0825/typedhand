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
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-th-forest text-lg font-bold text-th-canvas">
          ✎
        </span>
        <span className="text-lg font-bold tracking-tight text-th-ink">
          {APP_NAME}
        </span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-th-dusty bg-th-canvas p-7">
        <h1 className="text-xl font-semibold text-th-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-th-ink-mid">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>

      {footer && <div className="mt-5 text-sm text-th-ink-mid">{footer}</div>}
    </main>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-th-ink-mid">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-xl border border-th-dusty bg-th-canvas px-3.5 text-sm text-th-ink outline-none focus:border-th-forest/60"
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
    <p className="rounded-lg bg-th-forest/10 px-3 py-2 text-sm text-th-forest">
      {message}
    </p>
  );
}
