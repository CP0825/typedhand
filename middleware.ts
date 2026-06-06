import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files so the session
    // cookie stays fresh, while keeping the protected-route logic in one place.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$).*)",
  ],
};
