import { NextRequest, NextResponse } from "next/server";

/** UK place search for the mosque map's search bar, via OpenStreetMap's
 *  Nominatim (proxied with a proper User-Agent + 24 h cache, per its policy).
 *  GET /app-api/geocode?q=Birmingham → { results: [{ name, lat, lng }] } */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const cache = new Map<string, { at: number; body: unknown }>();
const TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] }, { headers: CORS });

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.body, { headers: CORS });

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=gb&limit=5&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KingstonMosqueApp/1.0 (contact: info@kingstonmosque.org)" },
    });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    const data = (await res.json()) as { display_name?: string; lat?: string; lon?: string }[];
    const body = {
      results: data.map((r) => ({
        name: String(r.display_name || "").split(",").slice(0, 3).join(","),
        lat: parseFloat(String(r.lat)),
        lng: parseFloat(String(r.lon)),
      })),
    };
    cache.set(key, { at: Date.now(), body });
    return NextResponse.json(body, { headers: CORS });
  } catch {
    return NextResponse.json({ results: [] }, { headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
