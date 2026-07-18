> **Note (July 2026):** WhatsApp broadcasting has been REMOVED from the platform.
> Email is the primary outbound channel, powered by the central Subscribers
> mailing list which syncs to Mailchimp (MAILCHIMP_API_KEY + MAILCHIMP_AUDIENCE_ID).
> Sections below mentioning WhatsApp are retained for history only.

# Broadcast Center

Write a notice once in the admin (**Broadcast → Broadcasts**), pick the channels,
tick **Send now**, and save. It fans out to every selected channel and writes a
per-channel **report** back onto the record. Each channel is independent and
fault-tolerant: an unconfigured channel is **skipped**, a failing one is marked
**failed**, and neither blocks the others.

Credentials and target IDs live in environment variables (like SMTP/S3), so
secrets never sit in the database. A channel only activates when its vars are set.

## Channels

### App notification (push)  ✅ recommended, free
Sends a push notification to everyone who installed the app / website and turned
on notifications — the same audience as a published announcement. Works as soon
as **Web Push is set up** (see `docs/PUSH.md`); needs no per-channel keys here.

### Email  ✅ recommended, easiest
Reuses the site's existing SMTP settings (`SMTP_*`). Sends to everyone in
**Subscribers** with *Wants email updates* on (and not unsubscribed), one message
each so addresses stay private.

### Telegram  ✅ recommended (true group posting, free)
Official Bot API — posts straight into your Telegram group/channel.
1. Create a bot with **@BotFather** → get `TELEGRAM_BOT_TOKEN`.
2. Add the bot to your group/channel as an admin.
3. Set `TELEGRAM_CHAT_ID` to the group/channel id (e.g. `@kingstonmosque` for a
   public channel, or the numeric `-100…` id for a private group).

### WhatsApp  ⚠️ important — read this
WhatsApp's official **Business Cloud API** (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`)
broadcasts to **opted-in subscribers** (the numbers in **Subscribers** with
*Wants WhatsApp updates* on). The mosque shares a "join updates" link/QR; people
opt in; we store their number with consent.

**The honest constraint:** the official API **cannot post into ordinary WhatsApp
groups** — only to individual opted-in users (and Channels). Also, business-
initiated messages **outside a 24-hour window require an approved message
template**; the plain-text path here works inside a session window or for testing.
For day-to-day announcements, register a template in Meta and the mosque is set.

> Posting into your *existing* WhatsApp groups would need an unofficial
> self-hosted gateway, which risks the number being banned. That was deferred by
> design — use Telegram for true group posting, and WhatsApp opt-in for WhatsApp
> reach.

### Facebook Page
Meta Graph API. Set `FACEBOOK_PAGE_ID` and a long-lived `FACEBOOK_PAGE_TOKEN`
(with `pages_manage_posts`). Posts text, or a photo if the broadcast has an image.

### Instagram
Set `INSTAGRAM_USER_ID` and `INSTAGRAM_TOKEN` (falls back to the Facebook Page
token). **Instagram requires an image** — text-only broadcasts skip Instagram.

## Subscribers

The **Subscribers** collection holds opt-in contacts (email and/or WhatsApp).
The public can be added via a future "join updates" form; staff manage the list
in the admin. `Broadcast` settings (admin global) hold the public
WhatsApp/Telegram join links and an optional sign-off.

## Notes

- Image broadcasts need a **publicly reachable** image URL, so set `SERVER_URL`
  (or use S3/R2 media storage) in production — local-disk media URLs aren't
  reachable by Meta/Telegram.
- A broadcast sends **once**: after sending, `status` becomes *Sent* and the
  *Send now* box is cleared automatically.
