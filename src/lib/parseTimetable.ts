/**
 * Parses the annual prayer-timetable CSV (the same format as the supplied file)
 * into structured days, with validation warnings. Shared by the admin upload
 * button and the build-time generator.
 */
export interface ParsedDay {
  date: string; // YYYY-MM-DD
  weekday: string;
  fajr: { begins: string; jamaah: string };
  sunrise: string;
  dhuhr: { begins: string; jamaah: string };
  asr: { begins: string; jamaah: string };
  maghrib: { begins: string; jamaah: string };
  isha: { begins: string; jamaah: string };
}

export interface ParseResult {
  days: ParsedDay[];
  warnings: string[];
  errors: string[];
}

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;

function ddmmyyyyToISO(d: string): string {
  const [dd, mm, yyyy] = d.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseTimetableCsv(raw: string): ParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const rows = raw
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(","));

  if (!rows.length) {
    return { days: [], warnings, errors: ["Empty file"] };
  }
  // drop header if present
  if (/day/i.test(rows[0][0]) && /date/i.test(rows[0][1])) rows.shift();

  const days: ParsedDay[] = [];
  let prevISO: string | null = null;

  for (const r of rows) {
    if (r.length < 15) {
      errors.push(`Row has ${r.length} columns (expected 15): ${r.join(",").slice(0, 40)}…`);
      continue;
    }
    const [day, date, fajr, sunrise, , dhuhr, asr, , maghrib, isha, jFajr, jDhuhr, jAsr, jMaghrib, jIsha] = r;
    const iso = ddmmyyyyToISO(date);

    for (const [name, v] of Object.entries({ fajr, sunrise, dhuhr, asr, maghrib, isha, jFajr, jDhuhr, jAsr, jMaghrib, jIsha })) {
      if (v && !TIME.test(v)) errors.push(`${date}: bad time for ${name}: "${v}"`);
    }
    if (prevISO) {
      const gap = (Date.parse(iso) - Date.parse(prevISO)) / 86400000;
      if (gap !== 1) warnings.push(`Gap between ${prevISO} and ${iso}`);
    }
    if (maghrib !== jMaghrib) warnings.push(`${date}: Maghrib begins (${maghrib}) ≠ J-Maghrib (${jMaghrib})`);
    prevISO = iso;

    days.push({
      date: iso,
      weekday: day,
      fajr: { begins: fajr, jamaah: jFajr },
      sunrise,
      dhuhr: { begins: dhuhr, jamaah: jDhuhr },
      asr: { begins: asr, jamaah: jAsr },
      maghrib: { begins: maghrib, jamaah: jMaghrib },
      isha: { begins: isha, jamaah: jIsha },
    });
  }

  return { days, warnings, errors };
}
