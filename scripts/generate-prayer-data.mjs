#!/usr/bin/env node
/**
 * Kingston Mosque — annual prayer timetable importer.
 *
 * Parses the yearly CSV (the "annual upload") into validated, typed JSON that
 * the website reads. This is the same pipeline the admin CMS will run when an
 * admin uploads next year's timetable.
 *
 * CSV columns:
 *   Day, Date, Fajr, Sunrise, Zawwal, Duhur, Asr, Sunset, Maghrib, Isha,
 *   J-Fajr, J-Duhur, J-Asr, J-Maghrib, J-Isha
 *
 * Notes validated against the supplied 2026 file:
 *  - Times are LOCAL wall-clock (Europe/London) with BST/GMT already baked in.
 *  - Maghrib "begins" == Maghrib jamaah on every row.
 *  - Zawwal & Sunset columns are empty placeholders.
 *
 * Usage: node scripts/generate-prayer-data.mjs <input.csv> <output.json> [year]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , inPath = 'data/prayer-timetable-2026.csv', outPath = 'data/prayer-times-2026.json', yearArg] =
  process.argv;

const raw = readFileSync(inPath, 'utf8');
// Handle CR, CRLF or LF line endings.
const rows = raw
  .split(/\r\n|\r|\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => l.split(','));

const header = rows.shift();
const expected = ['Day', 'Date', 'Fajr', 'Sunrise', 'Zawwal', 'Duhur', 'Asr', 'Sunset', 'Maghrib', 'Isha', 'J-Fajr', 'J-Duhur', 'J-Asr', 'J-Maghrib', 'J-Isha'];
if (header.join(',') !== expected.join(',')) {
  console.warn('⚠️  Header differs from expected.\n  expected: ' + expected.join(',') + '\n  found:    ' + header.join(','));
}

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;
const warnings = [];
const errors = [];
const days = [];

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const ddmmyyyyToISO = (d) => {
  const [dd, mm, yyyy] = d.split('/');
  return `${yyyy}-${mm}-${dd}`;
};

let prevDate = null;
for (const r of rows) {
  const [day, date, fajr, sunrise, , dhuhr, asr, , maghrib, isha, jFajr, jDhuhr, jAsr, jMaghrib, jIsha] = r;
  const iso = ddmmyyyyToISO(date);

  // time-format validation
  for (const [name, val] of Object.entries({ fajr, sunrise, dhuhr, asr, maghrib, isha, jFajr, jDhuhr, jAsr, jMaghrib, jIsha })) {
    if (val && !TIME.test(val)) errors.push(`${date}: invalid time for ${name}: "${val}"`);
  }

  // contiguity check
  if (prevDate) {
    const gap = (Date.parse(iso) - Date.parse(prevDate)) / 86400000;
    if (gap !== 1) warnings.push(`Gap between ${prevDate} and ${iso} (${gap} days)`);
  }
  prevDate = iso;

  // ordering sanity (begins should ascend across the day)
  const order = [fajr, sunrise, dhuhr, asr, maghrib, isha].map(toMin);
  for (let k = 1; k < order.length; k++) {
    if (order[k] <= order[k - 1]) {
      warnings.push(`${date}: prayer "begins" times not strictly ascending (${[fajr, sunrise, dhuhr, asr, maghrib, isha].join(' ')})`);
      break;
    }
  }

  // Maghrib begins == jamaah invariant
  if (maghrib !== jMaghrib) warnings.push(`${date}: Maghrib begins (${maghrib}) != J-Maghrib (${jMaghrib})`);

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

// Outlier detection on jamaah times (catches data-entry slips like J-Isha 22:30 on 15/04).
for (const key of ['fajr', 'dhuhr', 'asr', 'isha']) {
  for (let k = 1; k < days.length - 1; k++) {
    const prev = toMin(days[k - 1][key].jamaah);
    const cur = toMin(days[k][key].jamaah);
    const next = toMin(days[k + 1][key].jamaah);
    if (Math.abs(cur - prev) > 30 && Math.abs(cur - next) > 30) {
      warnings.push(`Possible ${key} jamaah outlier on ${days[k].date}: ${days[k][key].jamaah} (neighbours ${days[k - 1][key].jamaah} / ${days[k + 1][key].jamaah})`);
    }
  }
}

const year = Number(yearArg) || Number(days[0]?.date.slice(0, 4)) || new Date().getFullYear();
const expectedRows = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
if (days.length !== expectedRows) warnings.push(`Expected ${expectedRows} rows for ${year}, found ${days.length}`);

const out = {
  year,
  timezone: 'Europe/London',
  note: 'Local wall-clock times; BST/GMT already applied. Maghrib jamaah = Maghrib begins.',
  source: inPath,
  generatedAt: new Date().toISOString(),
  count: days.length,
  days,
};

writeFileSync(outPath, JSON.stringify(out, null, 2));

console.log(`\n✅ Parsed ${days.length} days for ${year} → ${outPath}`);
console.log(`   Range: ${days[0]?.date} … ${days[days.length - 1]?.date}`);
if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log('   • ' + w));
}
if (errors.length) {
  console.log(`\n❌ ${errors.length} error(s):`);
  errors.forEach((e) => console.log('   • ' + e));
  process.exitCode = 1;
}
if (!warnings.length && !errors.length) console.log('   No issues found.');
