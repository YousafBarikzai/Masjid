/**
 * Imports the full annual timetable (data/prayer-times-YEAR.json) into the CMS
 * PrayerDays collection. Idempotent: only creates days that don't exist yet.
 * This is the practical "annual upload" until the in-admin upload screen lands.
 *
 *   node scripts/import-prayer-times.mjs [path-to-json]
 *
 * Env: BASE, SEED_EMAIL, SEED_PASSWORD
 */
import { readFileSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3000";
const EMAIL = process.env.SEED_EMAIL || "admin@kingstonmosque.org";
const PASSWORD = process.env.SEED_PASSWORD || "Masjid2026!";
const jsonPath = process.argv[2] || "data/prayer-times-2026.json";

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

async function login() {
  const r = await fetch(`${BASE}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const j = await r.json();
  if (!j.token) throw new Error("login failed");
  return j.token;
}

async function existingDates(token) {
  const dates = new Set();
  let page = 1;
  for (;;) {
    const r = await fetch(`${BASE}/api/prayer-days?limit=300&page=${page}&depth=0`, {
      headers: { Authorization: `JWT ${token}` },
    });
    const j = await r.json();
    for (const d of j.docs || []) dates.add(String(d.date).slice(0, 10));
    if (!j.hasNextPage) break;
    page++;
  }
  return dates;
}

const token = await login();
const have = await existingDates(token);

const toCreate = data.days.filter((d) => !have.has(d.date));
console.log(`${data.days.length} days in file · ${have.size} already in CMS · creating ${toCreate.length}`);

let done = 0;
const CONCURRENCY = 8;
async function worker(queue) {
  while (queue.length) {
    const d = queue.pop();
    const body = {
      date: d.date,
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
      source: "import",
    };
    const r = await fetch(`${BASE}/api/prayer-days`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
      body: JSON.stringify(body),
    });
    if (r.ok) done++;
    else if (done < 3) console.warn("fail", d.date, r.status, (await r.text()).slice(0, 120));
  }
}

const queue = [...toCreate];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
console.log(`✅ Created ${done} prayer days.`);
