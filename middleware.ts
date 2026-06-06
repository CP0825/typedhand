import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/editor", "/dashboard", "/admin"];

// Lightweight Edge guard with NO Supabase import. The Supabase SSR client pulls
// in Node-only modules that Vercel's Edge runtime cannot bundle ("Edge Function
// middleware is referencing unsupported modules"), and Vercel always packages
// middleware as an Edge Function regardless of the runtime export. So this only
// checks for the *presence* of a Supabase auth cookie and bounces logged-out
// users off protected routes for a fast redirect. The authoritative checks
// (getUser() and the is_admin gate) run server-side in each protected page and
// API route, where the Supabase client works normally.
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  // Supabase stores the session in cookies named `sb-<ref>-auth-token`
  // (sometimes chunked with a `.0`/`.1` suffix). We only check existence here.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/editor/:path*", "/dashboard/:path*", "/admin/:path*"],
};
