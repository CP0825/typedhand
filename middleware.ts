import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Run on the Node.js runtime, not the Edge runtime. The Supabase client pulled
// in via updateSession() depends on Node-only modules that Vercel's Edge
// runtime cannot bundle ("referencing unsupported modules"). Node runtime keeps
// the existing session/route-protection logic working unchanged.
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
