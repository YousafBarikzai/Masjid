import Constants from "expo-constants";
import type {
  ArticleContent,
  ArticlesPage,
  ContentFeed,
  GeocodeResult,
  Khutbah,
  KhutbahsPage,
  LiveFeed,
  MonthGrid,
  Mosque,
  Snapshot,
} from "./types";

// Base URL of the deployed website/CMS. Override per build with the env var
// EXPO_PUBLIC_API_BASE, else falls back to app.json's extra.apiBase.
const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
const fromConfig = (Constants.expoConfig?.extra as { apiBase?: string } | undefined)?.apiBase;
export const apiBase = (fromEnv || fromConfig || "https://masjid-production.up.railway.app").replace(/\/$/, "");

/** Turn a site path ("/donate") or full URL into an absolute URL. */
export function absUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${apiBase}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function fetchSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  const res = await fetch(`${apiBase}/app-api/snapshot`, { signal });
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  return (await res.json()) as Snapshot;
}

export async function fetchMonth(month: string, signal?: AbortSignal): Promise<MonthGrid> {
  const res = await fetch(`${apiBase}/app-api/timetable-grid?month=${month}`, { signal });
  if (!res.ok) throw new Error(`month ${res.status}`);
  return (await res.json()) as MonthGrid;
}

export async function fetchContent(signal?: AbortSignal): Promise<ContentFeed> {
  const res = await fetch(`${apiBase}/app-api/content`, { signal });
  if (!res.ok) throw new Error(`content ${res.status}`);
  return (await res.json()) as ContentFeed;
}

/* Articles the app has seen this session (from the paginated feed AND the
   content feed) — lets the native reader open any article instantly even when
   it's beyond the cached first page. */
const articleRegistry = new Map<string, ArticleContent>();
export function rememberArticles(list: ArticleContent[] | undefined): void {
  for (const a of list ?? []) if (a.slug) articleRegistry.set(a.slug, a);
}
export function recallArticle(slug: string | undefined): ArticleContent | undefined {
  return slug ? articleRegistry.get(slug) : undefined;
}

export async function fetchArticles(page: number, signal?: AbortSignal): Promise<ArticlesPage> {
  const res = await fetch(`${apiBase}/app-api/articles?page=${page}`, { signal });
  if (!res.ok) throw new Error(`articles ${res.status}`);
  const data = (await res.json()) as ArticlesPage;
  rememberArticles(data.docs);
  return data;
}

/* Khutbahs the app has seen this session — same pattern as articles, so the
   detail page opens instantly from any archive page. */
const khutbahRegistry = new Map<string, Khutbah>();
export function rememberKhutbahs(list: Khutbah[] | undefined): void {
  for (const k of list ?? []) if (k.slug) khutbahRegistry.set(k.slug, k);
}
export function recallKhutbah(slug: string | undefined): Khutbah | undefined {
  return slug ? khutbahRegistry.get(slug) : undefined;
}

export async function fetchKhutbahs(page: number, signal?: AbortSignal): Promise<KhutbahsPage> {
  const res = await fetch(`${apiBase}/app-api/khutbahs?page=${page}`, { signal });
  if (!res.ok) throw new Error(`khutbahs ${res.status}`);
  const data = (await res.json()) as KhutbahsPage;
  rememberKhutbahs(data.docs);
  return data;
}

/* In-app donation checkout (Stripe). configured:false ⇒ key not set on the
   server yet; the Donate screen falls back to the external link / bank card. */
export async function createDonationSession(
  amount: number,
  interval: "one_off" | "month",
  campaign: string,
): Promise<{ configured: boolean; id?: string; url?: string }> {
  const res = await fetch(`${apiBase}/app-api/donate/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, interval, campaign }),
  });
  if (!res.ok) throw new Error(`donate-session ${res.status}`);
  return (await res.json()) as { configured: boolean; id?: string; url?: string };
}

export async function donationStatus(id: string): Promise<{ paid: boolean; status: string }> {
  const res = await fetch(`${apiBase}/app-api/donate/status?id=${encodeURIComponent(id)}`);
  if (!res.ok) return { paid: false, status: "error" };
  return (await res.json()) as { paid: boolean; status: string };
}

/** Mosques near a point, from OpenStreetMap (server-proxied + cached). */
export async function fetchMosques(
  lat: number,
  lng: number,
  radius: number,
  signal?: AbortSignal,
): Promise<Mosque[]> {
  const res = await fetch(
    `${apiBase}/app-api/mosques?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&radius=${Math.round(radius)}`,
    { signal },
  );
  if (!res.ok) throw new Error(`mosques ${res.status}`);
  const data = (await res.json()) as { mosques?: Mosque[] };
  return data.mosques ?? [];
}

/* Direct OpenStreetMap (Overpass) fallback, straight from the phone. This
   matters because the server proxy funnels every user through Railway's single
   IP, which Overpass rate-limits hard — so it can come back empty. Each phone
   has its own IP, so querying directly is far more reliable. Same query and
   mapping as the server route. */
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

function mapOverpass(elements: unknown[]): Mosque[] {
  const out: Mosque[] = [];
  for (const raw of elements ?? []) {
    const e = raw as {
      type?: string;
      id?: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    };
    const t = e.tags ?? {};
    const la = e.lat ?? e.center?.lat;
    const lo = e.lon ?? e.center?.lon;
    if (la == null || lo == null) continue;
    const address = [
      [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "),
      t["addr:city"],
      t["addr:postcode"],
    ]
      .filter(Boolean)
      .join(", ");
    out.push({
      id: `${e.type}/${e.id}`,
      name: t.name || t["name:en"] || "Mosque",
      lat: la,
      lng: lo,
      address,
      phone: t.phone || t["contact:phone"] || "",
      website: t.website || t["contact:website"] || "",
      wheelchair: t.wheelchair === "yes",
      openingHours: t.opening_hours || "",
      tags: t,
    });
  }
  return out;
}

export async function fetchMosquesDirect(
  lat: number,
  lng: number,
  radius: number,
  signal?: AbortSignal,
): Promise<Mosque[]> {
  const r = Math.round(Math.min(30000, Math.max(500, radius)));
  const q = `[out:json][timeout:25];(
    node["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});
    way["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});
    node["building"="mosque"](around:${r},${lat},${lng});
    way["building"="mosque"](around:${r},${lat},${lng});
  );out center 120;`;
  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(q)}`,
        signal,
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { elements?: unknown[] };
      const mosques = mapOverpass(data.elements ?? []);
      if (mosques.length) return mosques; // got results — done
    } catch {
      /* try the next mirror */
    }
  }
  return [];
}

/** UK place search for the map's search bar. */
export async function geocode(q: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const res = await fetch(`${apiBase}/app-api/geocode?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: GeocodeResult[] };
  return data.results ?? [];
}

/** Live-broadcast state: Makkah stream + Kingston live/recent recordings. */
export async function fetchLive(signal?: AbortSignal): Promise<LiveFeed> {
  const res = await fetch(`${apiBase}/app-api/live`, { signal });
  if (!res.ok) throw new Error(`live ${res.status}`);
  return (await res.json()) as LiveFeed;
}

export async function registerDevice(
  token: string,
  platform: "ios" | "android",
  topics: string[],
): Promise<void> {
  await fetch(`${apiBase}/app-api/register-device`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform, topics }),
  });
}
