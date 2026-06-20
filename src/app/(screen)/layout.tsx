import type { Metadata } from "next";
import "./screen.css";

// A separate root layout for the mosque display screens: no site header/footer,
// no theme toggle — just a full-bleed board. This is a sibling root layout to
// the public site and the admin (Next.js multiple-root-layouts pattern).
export const metadata: Metadata = {
  title: "Prayer Times — Mosque Display",
  // Never index the raw display board.
  robots: { index: false, follow: false },
};

export default function ScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&family=Amiri&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
