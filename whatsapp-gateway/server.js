// Kingston Mosque — self-hosted WhatsApp gateway.
//
// Logs in a DEDICATED mosque WhatsApp number (via a one-time QR scan) and exposes
// a tiny HTTP API the website's Broadcast Center calls to post messages into the
// mosque's WhatsApp group(s).
//
// ⚠️  This uses the unofficial WhatsApp Web protocol (Baileys). It is against
//     WhatsApp's Terms of Service — the number used here risks being banned.
//     Use a dedicated number, not anyone's personal WhatsApp.
//
// Endpoints (all except /status require the GATEWAY_SECRET):
//   GET  /            → pairing QR (scan once with the mosque phone)  ?key=SECRET
//   GET  /status      → { connected, hasQR }
//   GET  /groups      → list groups [{ id, subject }] so you find the group id
//   POST /send        → { groupId, text, imageUrl? }  (Bearer GATEWAY_SECRET)

import fs from "node:fs";
import express from "express";
import qrcode from "qrcode";
import pino from "pino";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

const PORT = process.env.PORT || 3000;
const SECRET = process.env.GATEWAY_SECRET || "";
const AUTH_DIR = process.env.AUTH_DIR || "auth";

let sock = null;
let connected = false;
let latestQR = null;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Kingston Mosque", "Chrome", "1.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      latestQR = qr;
      connected = false;
    }
    if (connection === "open") {
      connected = true;
      latestQR = null;
      console.log("✅ WhatsApp connected");
    }
    if (connection === "close") {
      connected = false;
      const code = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output?.statusCode : undefined;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log("connection closed; code:", code, "loggedOut:", loggedOut);
      if (loggedOut) {
        // Stale credentials — clear them so a fresh QR is generated on restart.
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }
      setTimeout(start, 3000);
    }
  });
}

start().catch((e) => console.error("gateway start failed:", e));

const app = express();
app.use(express.json({ limit: "2mb" }));

function authed(req, res) {
  const key = (req.get("authorization") || "").replace(/^Bearer\s+/i, "") || req.query.key;
  if (!SECRET || key !== SECRET) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}

app.get("/status", (_req, res) => res.json({ connected, hasQR: !!latestQR }));

// Link by phone number instead of scanning the QR. Returns an 8-char pairing
// code to type into WhatsApp → Linked devices → "Link with phone number".
// Use a DEDICATED number — this method risks a WhatsApp ban.
app.get("/pair", async (req, res) => {
  if (!authed(req, res)) return;
  const number = String(req.query.number || "").replace(/[^0-9]/g, ""); // e.g. 447951532529
  if (!number) return res.status(400).json({ error: "number required, in full international form e.g. 447951532529" });
  if (connected) return res.json({ status: "already_connected" });
  if (!sock) return res.status(503).json({ error: "gateway starting — try again in a few seconds" });
  if (sock.authState?.creds?.registered) return res.json({ status: "already_registered" });
  try {
    const code = await sock.requestPairingCode(number);
    res.json({
      pairingCode: code,
      instructions:
        "On the phone for this number: WhatsApp → Linked devices → Link a device → 'Link with phone number instead' → enter this code.",
    });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Pairing page.
app.get("/", async (req, res) => {
  if (!authed(req, res)) return;
  if (connected) return res.send("<h2 style='font-family:sans-serif'>✅ WhatsApp connected.</h2>");
  if (!latestQR) {
    return res.send(
      "<h2 style='font-family:sans-serif'>Starting… this page will refresh.</h2><script>setTimeout(()=>location.reload(),3000)</script>",
    );
  }
  const dataUrl = await qrcode.toDataURL(latestQR);
  res.send(
    `<div style="font-family:sans-serif;text-align:center;padding:30px">
       <h2>Link the mosque WhatsApp</h2>
       <p>On the mosque phone: WhatsApp → <b>Linked devices</b> → <b>Link a device</b>, then scan:</p>
       <img src="${dataUrl}" width="300" height="300" alt="QR"/>
       <p style="color:#888">This QR refreshes automatically.</p>
       <script>setTimeout(()=>location.reload(),20000)</script>
     </div>`,
  );
});

// List groups so you can find the group id to configure on the website.
app.get("/groups", async (req, res) => {
  if (!authed(req, res)) return;
  if (!connected || !sock) return res.status(503).json({ error: "not_connected" });
  try {
    const groups = await sock.groupFetchAllParticipating();
    res.json(Object.values(groups).map((g) => ({ id: g.id, subject: g.subject })));
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Send a message into a group.
app.post("/send", async (req, res) => {
  if (!authed(req, res)) return;
  if (!connected || !sock) return res.status(503).json({ error: "not_connected" });
  const { groupId, text, imageUrl } = req.body || {};
  if (!groupId || !text) return res.status(400).json({ error: "groupId and text are required" });
  try {
    if (imageUrl) {
      await sock.sendMessage(groupId, { image: { url: imageUrl }, caption: text });
    } else {
      await sock.sendMessage(groupId, { text });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => console.log("WhatsApp gateway listening on :" + PORT));
