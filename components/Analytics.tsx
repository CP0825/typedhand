"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

// Fires a $pageview on every client-side route change (and the first paint).
// Mounted once in the root layout. usePathname (not useSearchParams) so it
// needs no Suspense boundary. No-ops entirely when PostHog isn't configured.
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    track("$pageview");
  }, [pathname]);

  return null;
}
