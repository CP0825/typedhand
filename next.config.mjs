/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Allows middleware.ts to opt into the Node.js runtime (export const runtime =
  // "nodejs"), required because the Supabase middleware client isn't compatible
  // with the Edge runtime. Still gated behind an experimental flag in Next 15.5.
  experimental: {
    nodeMiddleware: true,
  },
};

export default nextConfig;
