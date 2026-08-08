import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/app-api", "/membership/account", "/nikah/account", "/nikah/apply"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
