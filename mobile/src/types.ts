// Mirrors the shape returned by the website's /app-api/snapshot endpoint.
// Kept as a small local interface so the app stays decoupled from the server
// build (the web app's Snapshot type is server-only).

export interface PrayerRow {
  key: string;
  en: string;
  ar: string;
  begins: string;
  jamaah: string | null;
  isInfo?: boolean;
}

export interface NextPrayer {
  name: string;
  time: string;
  diffSeconds: number;
  tomorrow: boolean;
}

export interface NewsItem {
  date: string;
  title: string;
  body: string;
  slug?: string;
}

export interface CardItem {
  tag?: string;
  icon?: string;
  title: string;
  body: string;
  href: string;
}

export interface Snapshot {
  generatedAt: string;
  date: { iso: string; gregorian: string; hijri: string };
  prayers: PrayerRow[];
  nextPrayer: NextPrayer;
  announcement: { enabled: boolean; label: string; message: string } | null;
  news: NewsItem[];
  events: CardItem[];
  services: CardItem[];
  classes: CardItem[];
  contact: {
    phone: string;
    phoneHref: string;
    email: string;
    address: { line1: string; city: string; postcode: string };
    mapsQuery: string;
    social: { label: string; href: string }[];
  };
}
