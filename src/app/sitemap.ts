import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/content";

const paths = [
  "",
  "/prayer-times",
  "/jummah",
  "/ramadan",
  "/education",
  "/services",
  "/services/nikah",
  "/services/funeral",
  "/events",
  "/donate",
  "/about",
  "/news",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return paths.map((p) => ({
    url: `${siteUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/prayer-times" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}
