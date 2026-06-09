/**
 * Seeds the Payload CMS with starter content via the REST API.
 * Run against a running server after the first admin user exists:
 *   node scripts/seed-cms.mjs
 */
const BASE = process.env.BASE || "http://localhost:3000";
const EMAIL = process.env.SEED_EMAIL || "admin@kingstonmosque.org";
const PASSWORD = process.env.SEED_PASSWORD || "Masjid2026!";

async function login() {
  const r = await fetch(`${BASE}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const j = await r.json();
  if (!j.token) throw new Error("login failed: " + JSON.stringify(j).slice(0, 200));
  return j.token;
}

async function post(path, data, token) {
  const r = await fetch(`${BASE}/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  });
  const txt = await r.text();
  console.log(r.ok ? "✅" : "⚠️ ", path, r.status, r.ok ? "" : txt.slice(0, 160));
  return r.ok;
}

const token = await login();

// globals
await post("globals/site-settings", {
  contact: {
    phone: "020 8549 5315",
    email: "info@kingstonmosque.org",
    addressLine1: "55 East Road",
    city: "Kingston upon Thames",
    postcode: "KT2 6EJ",
    mapsQuery: "Kingston Muslim Association, 55 East Road, Kingston upon Thames KT2 6EJ",
  },
  charityNumber: "(to confirm)",
  socials: [
    { label: "Facebook", url: "https://www.facebook.com/kmosque/" },
    { label: "Telegram", url: "https://t.me/kingstonmosque" },
  ],
}, token);

await post("globals/jummah-settings", {
  intro: "Two congregations every Friday — the first in English, the second in Arabic.",
  congregations: [
    { name: "First Jummah", language: "English", doors: "12:50 pm", khutbah: "1:10 pm" },
    { name: "Second Jummah", language: "Arabic", doors: "2:00 pm", khutbah: "2:10 pm" },
  ],
}, token);

await post("globals/donation-settings", {
  heading: "Your Sadaqah keeps the doors open",
  body: "Kingston Mosque runs entirely on the generosity of the community.",
  bankDetails: [
    { label: "Account name", value: "Kingston Muslim Association" },
    { label: "Bank", value: "NatWest" },
    { label: "Sort code", value: "60-60-02" },
    { label: "Account no.", value: "•••• 6156 (confirm)" },
  ],
}, token);

// events
for (const e of [
  { title: "Eid Prayer", slug: "eid-prayer", category: "Eid", location: "Main prayer hall", registrationUrl: "" },
  { title: "Taraweeh & I‘tikaaf", slug: "taraweeh-itikaaf", category: "Ramadan", location: "Kingston Mosque" },
  { title: "KMA Youth Club", slug: "youth-club", category: "Youth", location: "Community hall" },
]) await post("events", e, token);

// news posts
for (const p of [
  { title: "Eid prayer arrangements announced", slug: "eid-arrangements", publishedDate: new Date().toISOString(), excerpt: "Details of Eid congregations, timings and overflow space." },
  { title: "Teacher vacancies at the KMA Madrasah", slug: "madrasah-vacancies", publishedDate: new Date().toISOString(), excerpt: "We are looking for dedicated teachers to join our Madrasah." },
]) await post("posts", p, token);

// classes
for (const c of [
  { title: "Madrasah", category: "Children", ageRange: "6–16", schedule: "Mon–Fri evenings & weekends", description: "Qur'an, Islamic Studies & Hifz." },
  { title: "Sisters' Sunday Circle", category: "Sisters", schedule: "Sundays", description: "Faith, friendship and events for girls and women." },
]) await post("classes", c, token);

// services
for (const s of [
  { title: "Nikah", slug: "nikah", icon: "💍", summary: "Marriage services by our Imams." },
  { title: "Funeral & Ghusl", slug: "funeral", icon: "🤲", summary: "Free Ghusl & burial assistance." },
]) await post("services", s, token);

// a page
await post("pages", {
  title: "About the Mosque",
  slug: "about-the-mosque",
  intro: "Serving Kingston upon Thames since 1979.",
  _status: "published",
}, token);

// prayer overrides (today + an Eid example)
for (const d of [
  { date: "2026-06-09", fajrBegins: "02:44", fajrJamaah: "03:30", sunrise: "04:42", dhuhrBegins: "13:05", dhuhrJamaah: "13:30", asrBegins: "18:35", asrJamaah: "19:00", maghrib: "21:20", ishaBegins: "22:36", ishaJamaah: "22:45", source: "import" },
]) await post("prayer-days", d, token);

console.log("\nSeed complete.");
