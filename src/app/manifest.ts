import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest — makes the site installable ("Add to Home
// Screen") on phones with the mosque's own icon and a standalone, app-like UI.
// `shortcuts` add long-press app-icon quick actions; `screenshots` give the
// richer install dialog (Android/Chromium) instead of the bare "add" sheet.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kingston Mosque",
    short_name: "Kingston Mosque",
    description:
      "Prayer times, news, events and services for Kingston Mosque (Kingston Muslim Association).",
    start_url: "/?source=pwa",
    scope: "/",
    lang: "en-GB",
    dir: "ltr",
    display: "standalone",
    // Prefer the most app-like surface the device supports, falling back gracefully.
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0b3d2e",
    theme_color: "#0b3d2e",
    categories: ["lifestyle", "education", "navigation"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the installed icon → jump straight to the most-used screens.
    shortcuts: [
      {
        name: "Prayer Times",
        short_name: "Prayer",
        description: "Today's prayer and jamā'ah times",
        url: "/prayer-times?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Donate",
        short_name: "Donate",
        description: "Support the mosque",
        url: "/donate?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Events",
        short_name: "Events",
        description: "Upcoming events and programmes",
        url: "/events?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Contact",
        short_name: "Contact",
        description: "Get in touch with the mosque",
        url: "/contact?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home-narrow.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Kingston Mosque home — prayer times, news and services",
      },
    ],
  };
}
