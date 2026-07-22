/**
 * Generate the Expo app's icon / adaptive-icon / splash / favicon from the
 * OFFICIAL Kingston Muslim Association mark — the navy arch monogram ("I∏",
 * an abstract mosque gateway) from the KMA logo.
 *
 *  - icon / favicon: faithful brand rendering — navy mark on white.
 *  - splash: the same mark in warm gold on the app's deep-emerald ground with
 *    the KMA wordmark beneath, so the native splash flows into the animated
 *    in-app intro without a colour jump.
 *
 * Uses sharp from the repo root. Run from the repo root:
 *   node mobile/scripts/generate-assets.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("mobile/assets");

const NAVY = "#27348C";
const GOLD = "#c9a227";
const GOLD_SOFT = "#e8d59a";
const CREAM = "#f4efe2";

/** The KMA arch monogram. Geometry in a 512 box.
 *  Left: freestanding pillar (I). Right: gateway (∏) — two pillars joined by a
 *  lintel. Bar width 58, height 224, gap 34. */
function mark(color, x = 0, y = 0, s = 1) {
  const B = 58; // bar width
  const H = 224; // bar height
  const G = 34; // gap
  const x0 = 0;
  const x1 = B + G; // gateway left pillar
  const x2 = x1 + B + G; // gateway right pillar
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${color}">
    <rect x="${x0}" y="0" width="${B}" height="${H}"/>
    <rect x="${x1}" y="0" width="${B}" height="${H}"/>
    <rect x="${x2}" y="0" width="${B}" height="${H}"/>
    <rect x="${x1}" y="0" width="${x2 + B - x1}" height="${B}"/>
  </g>`;
}

const MARK_W = 58 * 3 + 34 * 2; // 242
const MARK_H = 224;

/* App icon — official branding: navy monogram on a clean white field with a
   whisper of cool gradient so it doesn't read flat on the home screen. */
const icon = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#eef0f6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${mark(NAVY, (512 - MARK_W) / 2, (512 - MARK_H) / 2)}
</svg>`;

/* Android adaptive icon foreground: mark centred within the safe zone. */
const adaptive = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#ffffff"/>
  ${mark(NAVY, (512 - MARK_W * 0.78) / 2, (512 - MARK_H * 0.78) / 2, 0.78)}
</svg>`;

/* Splash foreground (transparent; app.json paints #081f15 behind it):
   gold monogram + wordmark, sitting calmly in the centre of any screen. */
const splash = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GOLD_SOFT}"/>
      <stop offset="1" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  ${mark("url(#gold)", (512 - MARK_W * 0.9) / 2, 128, 0.9)}
  <text x="256" y="392" text-anchor="middle" font-family="DejaVu Sans, Helvetica, Arial, sans-serif"
        font-size="30" font-weight="bold" letter-spacing="6" fill="${CREAM}">KINGSTON</text>
  <text x="256" y="428" text-anchor="middle" font-family="DejaVu Sans, Helvetica, Arial, sans-serif"
        font-size="30" font-weight="bold" letter-spacing="6" fill="${GOLD_SOFT}">MUSLIM</text>
  <text x="256" y="458" text-anchor="middle" font-family="DejaVu Sans, Helvetica, Arial, sans-serif"
        font-size="17" letter-spacing="7" fill="rgba(244,239,226,0.65)">ASSOCIATION</text>
</svg>`;

async function main() {
  await mkdir(OUT, { recursive: true });
  await sharp(Buffer.from(icon)).resize(1024, 1024).png().toFile(path.join(OUT, "icon.png"));
  await sharp(Buffer.from(adaptive)).resize(1024, 1024).png().toFile(path.join(OUT, "adaptive-icon.png"));
  await sharp(Buffer.from(splash)).resize(1024, 1024).png().toFile(path.join(OUT, "splash-icon.png"));
  await sharp(Buffer.from(icon)).resize(48, 48).png().toFile(path.join(OUT, "favicon.png"));
  console.log("✓ mobile assets regenerated with the official KMA monogram");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
