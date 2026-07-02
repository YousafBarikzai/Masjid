# Push notifications (Web Push for the website & installed app)

The site can send **push notifications** to people who installed it / opted in —
e.g. when you publish an announcement, news post, or an urgent janāzah notice.
This is **free** and uses the browser's built-in Web Push (no third party).

It stays completely **off until you add two keys**, so nothing breaks before
setup. Once the keys are set, an "Enable notifications" control appears in the
app's **More** menu, and ticking **"Send push notification"** on an announcement
delivers it to everyone who opted in.

## One-time setup (~5 minutes)

### 1. Generate a VAPID key pair
Run this once on any machine with Node installed:

```bash
npx web-push generate-vapid-keys
```

It prints a **Public Key** and a **Private Key**. Keep the private key secret.

### 2. Add the keys to Railway (web service → Variables)

| Variable | Value |
|---|---|
| `VAPID_PUBLIC_KEY` | the Public Key from step 1 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | **the same** Public Key (the browser needs it) |
| `VAPID_PRIVATE_KEY` | the Private Key from step 1 (keep secret) |
| `VAPID_SUBJECT` | `mailto:info@kingstonmosque.org` (or any contact URL/email) |

> `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is read at **build time**, so add it **before**
> the deploy builds (or redeploy after adding it).

### 3. Redeploy
After the redeploy, open the site on a phone → **More** → **Enable** under
"Prayer & event alerts", and allow notifications.

## Sending a notification
1. In `/admin`, open **Announcements & Banners** (or create one).
2. Write the message, keep **Enabled** ticked, and tick **"Send push
   notification to the apps."**
3. Save. It sends **once** to every subscriber and marks itself as sent.
   - For an urgent **janāzah** alert, set severity to **Urgent** and send the
     same way.

## Prayer-time reminders (optional)
People who enable notifications can also turn on **"Prayer time reminders"** in
the More menu — a push **15 minutes before each jamāʿah**. This needs a tiny
scheduler to ping the site every minute:

1. Add a secret to Railway: `CRON_SECRET` = any long random text.
2. Point a free every-minute scheduler at:
   `https://YOUR-SITE/app-api/cron/prayer-reminders?key=YOUR_CRON_SECRET`
   - **cron-job.org** (free): create a cron job, interval **every 1 minute**,
     paste the URL above.
   - **Railway cron**: add a cron service that `curl`s that URL each minute.
   - **GitHub Actions**: a scheduled workflow (every 5 min is the GH minimum)
     that curls the URL — coarser, but zero extra services.
3. That's it. The endpoint only sends when a prayer is exactly the chosen number
   of minutes away, and is a no-op until `CRON_SECRET` + the VAPID keys are set.

## Notes & limits
- **iOS** delivers Web Push **only to the installed app** (iOS 16.4+). On iPhone
  people must "Add to Home Screen" first — the install prompt already nudges this.
- Subscriptions are stored in the **App Devices (Push)** collection
  (`device-tokens`, `platform: web`). Dead subscriptions are pruned automatically.
- The same pipeline also serves the future native apps (Expo) — no extra wiring.
- Per-device **prayer-time reminders** (a notification X minutes before each
  adhān) are a planned follow-up; they need a scheduler and aren't part of this
  step.
