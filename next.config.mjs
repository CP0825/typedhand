/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Required for middleware.ts to run on the Node.js runtime (export const
  // runtime = "nodejs"). Vercel's build pipeline gates Node middleware behind
  // this flag; without it the middleware is packaged as an Edge Function, which
  // cannot bundle the Supabase client ("referencing unsupported modules").
  // Next 15.5 logs an "unrecognized key" warning for this but still honors it.
  experimental: {
    nodeMiddleware: true,
  },
};

export default nextConfig;
