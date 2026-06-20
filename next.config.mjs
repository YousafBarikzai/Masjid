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
    ];
  },
};

export default withPayload(nextConfig);
