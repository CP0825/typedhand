import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";
import { LinkButton } from "@/components/ui/Button";
import { SignOutButton } from "@/components/layout/SignOutButton";

// Server component — reflects auth state without a client round-trip.
export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-th-dusty/50 bg-th-canvas/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-th-forest text-base font-bold text-th-canvas">
            ✎
          </span>
          <span className="text-[15px] font-bold tracking-tight text-th-ink">
            {APP_NAME}
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          {user ? (
            <>
              <LinkButton href="/editor" variant="ghost" size="sm">
                Editor
              </LinkButton>
              <LinkButton href="/dashboard" variant="ghost" size="sm">
                Dashboard
              </LinkButton>
              <SignOutButton />
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Log in
              </LinkButton>
              <LinkButton href="/signup" variant="primary" size="sm">
                Start for free
              </LinkButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
