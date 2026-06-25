import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        // Allow the display service worker to control the /display scope even
        // though the script is served from the site root.
        source: "/display-sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/display" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
      {
        // Baseline security headers on every response. Deliberately excludes a
        // strict Content-Security-Policy (which would need careful tuning against
        // the Payload admin's inline styles/scripts); HSTS only takes effect over
        // HTTPS, so it's inert on localhost.
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
