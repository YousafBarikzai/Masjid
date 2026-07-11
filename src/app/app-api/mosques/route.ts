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

const OVERPASS = "https://overpass-api.de/api/interpreter";
const cache = new Map<string, { at: number; body: unknown }>();
const TTL = 60 * 60 * 1000;

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

  const q = `[out:json][timeout:12];(
    node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lng});
    way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lng});
  );out center tags 80;`;

  try {
    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(q)}`,
    });
    if (!res.ok) throw new Error(`overpass ${res.status}`);
    const data = (await res.json()) as { elements?: any[] };
    const mosques = (data.elements ?? [])
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
