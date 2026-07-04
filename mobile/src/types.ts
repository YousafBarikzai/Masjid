// Mirrors the shapes returned by the website's app-api endpoints. Kept as small
// local interfaces so the app stays decoupled from the server build.

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

export interface JummahCongregation {
  name: string;
  language: string;
  doors: string;
  khutbah: string;
}

export interface AppConfig {
  welcome: string;
  timetablePdfUrl: string;
  quickLinks: { icon: string; label: string; url: string }[];
  mediaLinks: { kind: string; label: string; url: string }[];
  donateUrl: string;
  youtube: string;
}

export interface Snapshot {
  generatedAt: string;
  date: { iso: string; gregorian: string; hijri: string };
  prayers: PrayerRow[];
  nextPrayer: NextPrayer;
  isFriday?: boolean;
  jummah?: JummahCongregation[];
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
  app?: AppConfig;
}

/* Monthly timetable (app-api/timetable-grid) */
export interface MonthDay {
  date: string; // YYYY-MM-DD
  weekday: string;
  isOverride: boolean;
  fajrBegins: string;
  fajrJamaah: string;
  sunrise: string;
  dhuhrBegins: string;
  dhuhrJamaah: string;
  asrBegins: string;
  asrJamaah: string;
  maghrib: string;
  ishaBegins: string;
  ishaJamaah: string;
  note?: string;
}

export interface MonthGrid {
  year: number;
  month: string; // YYYY-MM
  days: MonthDay[];
}
