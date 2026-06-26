# Mosque Display Screens

The in-mosque TVs show a full-screen prayer board at **`/display`** (e.g.
`https://kingstonmosque.org/display`). It replaces the paid MasjidBox box at no
software cost. Everything on it is driven by the website CMS, so updates made in
the admin appear on every screen automatically — usually within ~60 seconds and
always within a few minutes.

## What the board shows

- Live clock + Hijri and Gregorian date
- All five daily prayers with **begins** and **jamā‘ah** times
- The **next jamā‘ah** highlighted, with a live countdown
- Sunrise (shurūq)
- A rotating banner of announcements, news and events from the CMS

## How it stays robust

- **Self-updating:** polls the CMS every 60s; no manual refresh, no app to update.
- **Survives Wi-Fi blips:** the last good board is cached (service worker +
  local storage), so a brief network drop never blanks the screen. A small red
  dot appears top-right while reconnecting.
- **Keeps the screen awake:** uses the browser Wake Lock API where supported.
- **Self-heals:** reloads itself once an hour to roll over to the new prayer day
  and pick up any site changes.

## One-time setup per TV (built-in browser)

> The board is a normal web page, so any smart-TV web browser can show it. TV
> browsers differ, so the exact menu names vary — the goal is: **opens on
> power-on, fills the screen, and never sleeps.**

1. **Open the board:** in the TV's web browser, go to `https://<your-domain>/display`.
2. **Full screen:** use the browser's fullscreen option if it has one, to hide
   the address bar.
3. **Auto-open on power-on:** set `https://<your-domain>/display` as the
   browser's **home page**, and/or add it as a bookmark/favourite on the first
   row so it's one click after switching on. Many TV browsers reopen the last
   page automatically.
4. **Stop the screen sleeping:** in the TV's **Settings → Power / Energy Saving
   / Eco**, turn off auto-power-off, sleep timer and screen saver. In **Picture**
   settings, disable any ambient/standby dimming.
5. Leave it running. The board updates itself from then on.

## Honest limitations of TV browsers

Smart-TV browsers vary a lot. Some will still show a thin address bar, dim after
a while, or not reopen the page automatically on power-on — these are TV
firmware behaviours the web page cannot override. If a particular TV won't stay
on the board cleanly, the reliable fallback is a **~£30 streaming stick**
(Amazon Fire TV Stick or any Android TV stick) running the free **Fully Kiosk
Browser** app, pointed at the same `/display` URL:

- Fully Kiosk auto-starts on boot, runs true full-screen (no address bar),
  blocks sleep, and reloads on errors — guaranteeing the "always on, no chrome"
  behaviour.
- No code or content changes are needed; it loads the exact same page.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Address bar visible | Use the browser's fullscreen mode, or switch to the Fire TV + Fully Kiosk fallback. |
| Screen goes dark after a while | Disable sleep/eco/screen-saver in the TV settings (step 4). |
| Board didn't update after a CMS change | Wait up to ~60s; it polls automatically. A red dot top-right means it's offline — check Wi-Fi. |
| Times look wrong for the day | The board uses the CMS prayer timetable; check the day's entry under **Prayer Timetable** in the admin. |
