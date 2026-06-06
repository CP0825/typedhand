import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ink/8 bg-paper">
      <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <p className="text-sm text-ink/50">
          © {year} {APP_NAME}. All rights reserved.
        </p>
        <nav className="flex items-center gap-5 text-sm text-ink/60">
          <Link href="/impressum" className="hover:text-ink">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-ink">
            Datenschutz
          </Link>
          <Link href="/agb" className="hover:text-ink">
            AGB
          </Link>
        </nav>
      </div>
    </footer>
  );
}
