# Kingston Mosque — WhatsApp Gateway

A small self-hosted service that posts the website's broadcasts into the
mosque's **WhatsApp group(s)**.

> ⚠️ **Important:** this uses the unofficial WhatsApp Web protocol (Baileys),
> which is **against WhatsApp's Terms of Service**. The number you link here can
> be **banned by WhatsApp**. Use a **dedicated mosque number** (e.g. a cheap
> second SIM / spare phone), never anyone's personal WhatsApp. You accept this
> risk by running it.

## What it does
The website's **Broadcast Center** calls this gateway over HTTP; the gateway,
logged in as the mosque number, sends the message into the configured group(s).

## Deploy on Railway (≈5 min)

1. **New service** in your Railway project → **Deploy from GitHub repo** →
   pick `YousafBarikzai/Masjid`.
2. In the new service **Settings → Source**, set **Root Directory** to
   `whatsapp-gateway`. (It has its own Dockerfile.)
3. **Variables** → add:
   - `GATEWAY_SECRET` = a long random string (you'll reuse it on the website)
   - `AUTH_DIR` = `/data/auth`
4. **Add a Volume** (Settings → Volumes) mounted at **`/data`** — this keeps the
   WhatsApp login so it doesn't need re-pairing on every restart.
5. **Networking** → generate a public domain for this service (note the URL).
6. Deploy.

## Pair the mosque WhatsApp (one time)

Use a **dedicated number** — this method can get the number **banned**.

**Option A — scan a QR:**
1. Open `https://<gateway-domain>/?key=YOUR_GATEWAY_SECRET` in a browser.
2. On the **mosque phone**: WhatsApp → **Linked devices** → **Link a device** → scan it.

**Option B — link by phone number (no scanning):**
1. Open `https://<gateway-domain>/pair?number=447951532529&key=YOUR_GATEWAY_SECRET`
   (use the number in full international form, digits only — UK `07…` becomes `447…`).
2. It returns an 8-character `pairingCode`.
3. On the phone: WhatsApp → **Linked devices** → **Link a device** →
   **“Link with phone number instead”** → enter the code.

Either way, `https://<gateway-domain>/status` then shows `"connected": true`.
(The `/data` volume keeps it linked across restarts.)

## Find your group id

Open `https://<gateway-domain>/groups?key=YOUR_GATEWAY_SECRET` — it lists the
groups the mosque number is in, each with an `id` like
`1203630xxxxxxxxx@g.us`. Copy the id(s) of the group(s) you want to post to.

## Connect it to the website

On the **main website** service (Railway → Variables), add:

- `WHATSAPP_GATEWAY_URL` = `https://<gateway-domain>`
- `WHATSAPP_GATEWAY_SECRET` = the same `GATEWAY_SECRET`
- `WHATSAPP_GROUP_IDS` = the group id(s), comma-separated

Redeploy the website. Now in the admin **Broadcast → Broadcasts**, ticking
**WhatsApp** posts straight into your group(s).

## Endpoints (reference)
- `GET /` — pairing QR (needs `?key=` or Bearer secret)
- `GET /status` — `{ connected, hasQR }`
- `GET /groups` — list groups (needs secret)
- `POST /send` — `{ groupId, text, imageUrl? }` (Bearer secret)

## Local test
```bash
cd whatsapp-gateway
npm install
GATEWAY_SECRET=test npm start
# open http://localhost:3000/?key=test to scan the QR
```
