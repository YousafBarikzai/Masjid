import { getPayloadClient } from "@/lib/payloadClient";
import { showsOn } from "@/payload/collections";

// iCalendar feed of mosque events — usable as a "subscribe to calendar" URL or a
// downloadable .ics. Pulls from the Events collection; empty (but valid) until
// events are published in the admin.
export const dynamic = "force-dynamic";

function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/([\\;,])/g, "\\$1")
    .replace(/\n/g, "\\n");
}

export async function GET() {
  let docs: Array<Record<string, unknown>> = [];
  try {
    const p = await getPayloadClient();
    const res = await p.find({ collection: "events", sort: "start", limit: 200, depth: 0 });
    docs = res.docs.filter((e) => showsOn(e, "app")) as Array<Record<string, unknown>>;
  } catch {
    /* return an empty but valid calendar */
  }

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kingston Mosque//Events//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Kingston Mosque Events",
  ];
  for (const e of docs) {
    if (!e.start) continue;
    const start = new Date(e.start as string);
    const end = e.end ? new Date(e.end as string) : new Date(start.getTime() + 60 * 60 * 1000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@kingstonmosque.org`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${esc(e.title)}`,
      e.location ? `LOCATION:${esc(e.location)}` : "",
      e.summary ? `DESCRIPTION:${esc(e.summary)}` : "",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.filter(Boolean).join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="kingston-mosque-events.ics"',
    },
  });
}
