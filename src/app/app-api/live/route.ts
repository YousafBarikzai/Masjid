import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { youtubeChannelUrl } from "@/lib/site-content";

/**
 * The app's Live page feed.
 *
 * Kingston Masjid live: two mechanisms, either is enough —
 *  1) Manual (always available): staff paste the YouTube live link into
 *     admin → Mobile App → Live broadcast while streaming, clear it after.
 *  2) Automatic (env-gated): with YOUTUBE_API_KEY + YOUTUBE_CHANNEL_ID set,
 *     we ask the YouTube Data API whether the channel is live right now and
 *     also return recent uploads for the "recent recordings" list.
 *
 * Makkah: the official KSA Qur'an TV (Saudi Broadcasting Authority) live
 * stream via YouTube's own channel-live embed, overridable in the admin.
 */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const MAKKAH_DEFAULT = "https://www.youtube.com/embed/live_stream?channel=UCos52azQNBgW63_9uDJoPDA";

/** Any YouTube URL → embeddable player URL. */
function toEmbed(url: string): string {
  const watch = url.match(/[?&]v=([\w-]{6,})/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}?autoplay=0&playsinline=1`;
  const short = url.match(/youtu\.be\/([\w-]{6,})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}?autoplay=0&playsinline=1`;
  const live = url.match(/youtube\.com\/live\/([\w-]{6,})/);
  if (live) return `https://www.youtube.com/embed/${live[1]}?autoplay=0&playsinline=1`;
  return url; // already an embed (or another provider's player URL)
}

type Recent = { title: string; videoId: string; published: string };

export async function GET() {
  // CMS-managed settings
  let kingstonManual = "";
  let makkahUrl = MAKKAH_DEFAULT;
  try {
    const p = await getPayloadClient();
    const g = (await p.findGlobal({ slug: "app-settings" as never, depth: 0 })) as Record<string, any>;
    if (typeof g?.kingstonLiveUrl === "string") kingstonManual = g.kingstonLiveUrl.trim();
    if (typeof g?.makkahLiveUrl === "string" && g.makkahLiveUrl.trim()) makkahUrl = g.makkahLiveUrl.trim();
  } catch {
    /* defaults stand */
  }

  let live = Boolean(kingstonManual);
  let liveEmbed = kingstonManual ? toEmbed(kingstonManual) : "";
  let liveTitle = "";
  let recent: Recent[] = [];

  const key = process.env.YOUTUBE_API_KEY;
  const channel = process.env.YOUTUBE_CHANNEL_ID;
  if (key && channel) {
    try {
      // Live check (only if staff haven't already pasted a link).
      if (!live) {
        const r = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel}&eventType=live&type=video&maxResults=1&key=${key}`,
        );
        const d = (await r.json()) as any;
        const item = d.items?.[0];
        if (item?.id?.videoId) {
          live = true;
          liveEmbed = `https://www.youtube.com/embed/${item.id.videoId}?autoplay=0&playsinline=1`;
          liveTitle = String(item.snippet?.title || "");
        }
      }
      // Recent uploads for the "recent recordings" list.
      const rr = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel}&order=date&type=video&maxResults=6&key=${key}`,
      );
      const dd = (await rr.json()) as any;
      recent = (dd.items ?? [])
        .filter((i: any) => i?.id?.videoId)
        .map((i: any) => ({
          title: String(i.snippet?.title || "Recording"),
          videoId: String(i.id.videoId),
          published: String(i.snippet?.publishedAt || "").slice(0, 10),
        }));
    } catch {
      /* auto-detection is best-effort */
    }
  }

  return NextResponse.json(
    {
      kingston: { live, embedUrl: liveEmbed, title: liveTitle, channelUrl: youtubeChannelUrl },
      makkah: { embedUrl: toEmbed(makkahUrl), attribution: "Official KSA Qur'an TV — Saudi Broadcasting Authority" },
      recent,
    },
    { headers: CORS },
  );
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
