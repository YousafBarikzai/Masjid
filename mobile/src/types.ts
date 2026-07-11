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

/* Native content feed (app-api/content) — powers the service, information,
   donation and article screens without any web views. */
export interface ContentSection {
  heading?: string;
  body?: string[];
  bullets?: string[];
}

export interface ServiceContent {
  slug: string;
  title: string;
  icon: string;
  intro: string;
  sections: ContentSection[];
  cta: { heading: string; body: string } | null;
}

export interface ArticleContent {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image?: string;
  sections: ContentSection[];
}

export interface ArticlesPage {
  docs: ArticleContent[];
  page: number;
  totalPages: number;
  totalDocs: number;
  hasMore: boolean;
}

export interface EventContent {
  slug: string;
  title: string;
  tag: string;
  when: string;
  where: string;
  summary: string;
  image?: string;
  sections: ContentSection[];
  registrationUrl: string;
}

export interface ContentFeed {
  generatedAt: string;
  services: ServiceContent[];
  articles: ArticleContent[];
  events: EventContent[];
  donation: {
    heading: string;
    body: string;
    donateUrl: string;
    presets: number[];
    giftAid: boolean;
    monthly: boolean;
    bank: { label: string; value: string }[];
    categories: { icon: string; title: string; body: string }[];
  };
  jummah: { intro: string; congregations: JummahCongregation[] };
  contact: {
    phone: string;
    phoneHref: string;
    email: string;
    address: { line1: string; city: string; postcode: string };
    mapsQuery: string;
  };
  qibla: { kaabaLat: number; kaabaLng: number };
}
