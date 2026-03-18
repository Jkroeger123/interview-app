import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PostHog reverse proxy rewrites
  async rewrites() {
    return [
      {
        // Static assets (JS SDK, etc.) - must come first
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        // API requests (events, feature flags, session recordings)
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  // Prevent Next.js from redirecting trailing slashes (PostHog API uses them)
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
