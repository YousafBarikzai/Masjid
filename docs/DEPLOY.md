# Putting Kingston Mosque online (getting your URL)

This guide takes about **10 minutes** and gives you a public web address such as
`https://kingston-mosque.vercel.app`. No coding required — just clicking through
a few screens. You can later connect your real domain (kingstonmosque.org).

You will need:
- The GitHub account that owns this repository.
- A free **Vercel** account (sign up with that same GitHub account): https://vercel.com

---

## Step 1 — Import the project into Vercel
1. Go to https://vercel.com and **Log in with GitHub**.
2. Click **Add New… → Project**.
3. Find the **Masjid** repository and click **Import**.
4. Vercel auto-detects Next.js. Leave the build settings as they are.
   *(Don't click Deploy yet — first add the database and secret in Step 2/3.)*

## Step 2 — Add a database (Postgres)
1. In the same Vercel project, open the **Storage** tab → **Create Database**.
2. Choose **Neon** (Serverless Postgres) → **Continue**, give it a name, **Create**.
3. Click **Connect** to link it to this project.
   - This automatically adds a `POSTGRES_URL` environment variable — the site is
     already set up to use it, so there's nothing to copy.

## Step 3 — Add the security secret
1. In the project, open **Settings → Environment Variables**.
2. Add one variable:
   - **Name:** `PAYLOAD_SECRET`
   - **Value:** any long random text (e.g. mash the keyboard for 40+ characters).
3. Save.

## Step 4 — Deploy
1. Open the **Deployments** tab → **Deploy** (or **Redeploy** if it already built).
2. Wait ~2 minutes. When it finishes you'll get your public URL, e.g.
   `https://kingston-mosque.vercel.app`. 🎉

## Step 5 — Create your admin login
1. Visit **`https://YOUR-URL/admin`**.
2. The first time, it asks you to **create the first admin user** — enter your
   name, email and a password. That's your login.
3. You're in! Add prayer times, events, announcements, Jummah times, donation
   details and pages — all changes appear on the public site immediately.

> Tip: to pre-fill the site with starter content, a developer can run
> `node scripts/seed-cms.mjs` against the live URL (set `BASE`, `SEED_EMAIL`,
> `SEED_PASSWORD`). Otherwise just add content yourself in the admin.

---

## Connecting your real domain (optional, later)
In Vercel: **Settings → Domains → Add** `www.kingstonmosque.org`, then update the
DNS records as Vercel instructs. (Do this once you're happy with the site.)

## Optional: persistent images & PDFs (S3 / Cloudflare R2)
Text content, prayer times, events and links all work immediately. To make
**uploaded images and PDFs** persist on Vercel, add an S3-compatible bucket
(AWS S3 or Cloudflare R2 — R2 has a generous free tier) and set these
environment variables in **Vercel → Settings → Environment Variables**:

- `S3_BUCKET` — your bucket name
- `S3_REGION` — e.g. `eu-west-2` (for R2 use `auto`)
- `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT` — only for R2/other providers (the bucket's S3 API endpoint); leave blank for AWS S3

Redeploy after adding them. With these unset, uploads fall back to local disk
(fine for testing, not persistent on serverless).
- The site uses **per-day prayer-time overrides** and the annual timetable from
  `data/prayer-times-2026.json`. Each year, upload the new timetable (CSV → run
  `npm run generate:prayer`, or use the upcoming in-admin upload screen).
- **Environment variables** the app understands:
  - `DATABASE_URI` or `POSTGRES_URL` — Postgres connection string (set by Step 2).
  - `PAYLOAD_SECRET` — required; signs admin login tokens.
