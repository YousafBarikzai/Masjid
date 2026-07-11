import { NextRequest, NextResponse } from "next/server";

/**
 * Nearby mosques for the app's map, from OpenStreetMap (Overpass API) —
 * free, global, real community-maintained data. Proxied and cached here
 * (1 h per map tile) so phones stay fast and Overpass rate limits are safe.
 *
 *   GET /app-api/mosques?lat=51.41&lng=-0.30&radius=5000
 *   → { mosques: [{ id, name, lat, lng, address, phone, website,
 *                   wheelchair, openingHours, tags }] }
 */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

// Several public Overpass instances — the main one is often overloaded (429/504),
// so we try mirrors in turn until one answers. A descriptive User-Agent is
// required by Overpass usage policy; without it some instances reject the call.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];
const UA = "KingstonMosqueApp/1.0 (https://kingstonmosque.org; info@kingstonmosque.org)";
const cache = new Map<string, { at: number; body: unknown }>();
const TTL = 60 * 60 * 1000;

/** POST an Overpass query, trying each mirror until one returns data. */
async function overpass(query: string): Promise<{ elements?: unknown[] }> {
  let lastErr: unknown = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        lastErr = new Error(`${url} → ${res.status}`);
        continue;
      }
      return (await res.json()) as { elements?: unknown[] };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("all overpass endpoints failed");
}

function addressOf(t: Record<string, string>): string {
  const parts = [
    [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "),
    t["addr:city"],
    t["addr:postcode"],
  ].filter(Boolean);
  return parts.join(", ");
}

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") || "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") || "");
  const radius = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("radius") || "5000", 10) || 5000, 500), 30000);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "invalid_location" }, { status: 400, headers: CORS });
  }

  // Tile the cache key (~1 km grid) so panning reuses results.
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${radius}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) {
    return NextResponse.json(hit.body, { headers: CORS });
  }

  const q = `[out:json][timeout:20];(
    node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lng});
    way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lng});
    node["building"="mosque"](around:${radius},${lat},${lng});
    way["building"="mosque"](around:${radius},${lat},${lng});
  );out center tags 120;`;

  try {
    const data = await overpass(q);
    const mosques = ((data.elements as any[]) ?? [])
      .map((e) => {
        const t: Record<string, string> = e.tags ?? {};
        const la = e.lat ?? e.center?.lat;
        const lo = e.lon ?? e.center?.lon;
        if (la == null || lo == null) return null;
        return {
          id: `${e.type}/${e.id}`,
          name: t.name || t["name:en"] || "Mosque",
          lat: la,
          lng: lo,
          address: addressOf(t),
          phone: t.phone || t["contact:phone"] || "",
          website: t.website || t["contact:website"] || "",
          wheelchair: t.wheelchair === "yes",
          openingHours: t.opening_hours || "",
          tags: t,
        };
      })
      .filter(Boolean);
    const body = { mosques };
    cache.set(key, { at: Date.now(), body });
    return NextResponse.json(body, { headers: CORS });
  } catch {
    return NextResponse.json({ mosques: [], error: "lookup_failed" }, { headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
