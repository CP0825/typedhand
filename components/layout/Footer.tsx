import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-th-dusty/50 bg-th-canvas">
      <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <p className="text-sm text-th-ink-light">
          © {year} {APP_NAME}. All rights reserved.
        </p>
        <nav className="flex items-center gap-5 text-sm text-th-ink-mid">
          <Link href="/impressum" className="hover:text-th-ink">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-th-ink">
            Datenschutz
          </Link>
          <Link href="/agb" className="hover:text-th-ink">
            AGB
          </Link>
        </nav>
      </div>
    </footer>
  );
}
