import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { timetable } from "@/lib/prayer";

/* Spreadsheet feed for the admin timetable grid.
   GET  ?month=YYYY-MM → every day that month with begins + jamāʿah (iqāmah)
        per salah — CMS overrides merged over the annual timetable, with a flag
        showing which days are overridden.
   POST { date, values } (staff only) → upserts that day's override with the
        FULL row (base merged with the edit), because an override replaces the
        whole day on the website/screens. */

export const dynamic = "force-dynamic";

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const FIELDS = [
  "fajrBegins",
  "fajrJamaah",
  "sunrise",
  "dhuhrBegins",
  "dhuhrJamaah",
  "asrBegins",
  "asrJamaah",
  "maghrib",
  "ishaBegins",
  "ishaJamaah",
] as const;
type Field = (typeof FIELDS)[number];

function baseRow(dateISO: string): Record<Field, string> | null {
  const d = timetable.days.find((x) => x.date === dateISO);
  if (!d) return null;
  return {
    fajrBegins: d.fajr.begins,
    fajrJamaah: d.fajr.jamaah,
    sunrise: d.sunrise,
    dhuhrBegins: d.dhuhr.begins,
    dhuhrJamaah: d.dhuhr.jamaah,
    asrBegins: d.asr.begins,
    asrJamaah: d.asr.jamaah,
    maghrib: d.maghrib.begins,
    ishaBegins: d.isha.begins,
    ishaJamaah: d.isha.jamaah,
  };
}

async function findOverride(p: Awaited<ReturnType<typeof getPayloadClient>>, dateISO: string) {
  const res = await p.find({
    collection: "prayer-days",
    where: {
      and: [
        { date: { greater_than_equal: `${dateISO}T00:00:00.000Z` } },
        { date: { less_than_equal: `${dateISO}T23:59:59.999Z` } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return (res.docs[0] as Record<string, unknown>) ?? null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const month = url.searchParams.get("month") || ""; // YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
  }

  const p = await getPayloadClient();
  // One query for the month's overrides, keyed by date.
  const overrides = await p.find({
    collection: "prayer-days",
    where: {
      and: [
        { date: { greater_than_equal: `${month}-01T00:00:00.000Z` } },
        { date: { less_than_equal: `${month}-31T23:59:59.999Z` } },
      ],
    },
    limit: 400,
    depth: 0,
    overrideAccess: true,
  });
  const byDate = new Map<string, Record<string, unknown>>();
  for (const doc of overrides.docs as Array<Record<string, unknown>>) {
    const iso = String(doc.date).slice(0, 10);
    byDate.set(iso, doc);
  }

  const days = timetable.days
    .filter((d) => d.date.startsWith(month))
    .map((d) => {
      const base = baseRow(d.date)!;
      const ov = byDate.get(d.date);
      const row: Record<string, unknown> = { date: d.date, weekday: d.weekday, isOverride: !!ov };
      for (const f of FIELDS) {
        const val = ov?.[f];
        row[f] = typeof val === "string" && val ? val : base[f];
      }
      row.note = (ov?.note as string) || "";
      return row;
    });

  return NextResponse.json(
    { year: timetable.year, month, days },
    { headers: { "Cache-Control": "no-store" } },
  );
}

const CAN_EDIT = new Set(["super-admin", "admin", "editor", "prayer-times-manager"]);

export async function POST(req: Request) {
  const p = await getPayloadClient();
  const { user } = await p.auth({ headers: req.headers as unknown as Headers });
  const u = user as unknown as { roles?: string[] } | null;
  const roles: string[] = Array.isArray(u?.roles) ? u.roles : [];
  if (!user || !roles.some((r) => CAN_EDIT.has(r))) {
    return NextResponse.json({ error: "not allowed" }, { status: 403 });
  }

  let body: { date?: unknown; values?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const date = typeof body.date === "string" ? body.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  const base = baseRow(date);
  if (!base) return NextResponse.json({ error: "date outside the loaded timetable" }, { status: 400 });

  // Only known fields, only valid HH:MM values.
  const edits: Partial<Record<Field, string>> = {};
  for (const f of FIELDS) {
    const v = body.values?.[f];
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!TIME_RE.test(t)) {
      return NextResponse.json({ error: `${f} must be HH:MM (24-hour)`, field: f }, { status: 400 });
    }
    edits[f] = t.length === 4 ? `0${t}` : t; // normalise 6:40 → 06:40
  }
  const note = typeof body.values?.note === "string" ? (body.values.note as string).slice(0, 120) : undefined;
  if (Object.keys(edits).length === 0 && note === undefined) {
    return NextResponse.json({ error: "nothing to save" }, { status: 400 });
  }

  // Full-row upsert: base + existing override + this edit (an override replaces
  // the whole day, so every field must be present and correct).
  const existing = await findOverride(p, date);
  const full: Record<string, unknown> = { date: `${date}T12:00:00.000Z`, source: "manual" };
  for (const f of FIELDS) {
    const prev = existing?.[f];
    full[f] = edits[f] ?? (typeof prev === "string" && prev ? prev : base[f]);
  }
  if (note !== undefined) full.note = note;
  else if (existing?.note) full.note = existing.note;

  const saved = existing
    ? await p.update({ collection: "prayer-days", id: existing.id as string | number, data: full as never, overrideAccess: true })
    : await p.create({ collection: "prayer-days", data: full as never, overrideAccess: true });

  return NextResponse.json({ ok: true, id: (saved as { id: string | number }).id });
}
