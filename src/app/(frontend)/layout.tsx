import "../globals.css";
import type { Metadata, Viewport } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import PwaRegister from "@/components/pwa/PwaRegister";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import { site, siteUrl } from "@/lib/content";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.org}`,
    template: `%s · ${site.name}`,
  },
  description: site.intro,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: site.name,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: `${site.name} — ${site.org}`,
    description: site.intro,
    type: "website",
    locale: "en_GB",
    url: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b3d2e",
  // Let the page draw under the iOS notch/home-indicator so the standalone PWA
  // feels full-screen; components opt back in with env(safe-area-inset-*).
  viewportFit: "cover",
};

// The header/footer read live data from the CMS, so render at request time.
export const dynamic = "force-dynamic";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Mosque",
  name: site.name,
  alternateName: site.org,
  url: siteUrl,
  telephone: site.phone,
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.line1,
    addressLocality: site.address.city,
    postalCode: site.address.postcode,
    addressCountry: "GB",
  },
  sameAs: site.social.map((s) => s.href),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Amiri:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <PwaRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
