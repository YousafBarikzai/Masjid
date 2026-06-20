import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest — makes the site installable ("Add to Home
// Screen") on phones with the mosque's own icon and a standalone, app-like UI.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kingston Mosque",
    short_name: "Kingston Mosque",
    description: "Prayer times, news, events and services for Kingston Mosque (Kingston Muslim Association).",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b3d2e",
    theme_color: "#0b3d2e",
    categories: ["lifestyle", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
