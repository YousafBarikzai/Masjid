/**
 * Generate the Expo app's icon / adaptive-icon / splash / favicon from the same
 * gold-mosque-on-green emblem used by the website PWA, so every surface shares
 * one mark. Uses sharp from the repo root. Run from the repo root:
 *   node mobile/scripts/generate-assets.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("mobile/assets");

const dome = (cx, hw, by, py) =>
  `M${cx - hw} ${by} Q${cx - hw} ${py} ${cx} ${py} Q${cx + hw} ${py} ${cx + hw} ${by} Z`;

const minaret = (cx) => `
  <rect x="${cx - 13}" y="206" width="26" height="188" rx="4" fill="#e8d59a"/>
  <rect x="${cx - 18}" y="236" width="36" height="9" rx="3" fill="#c9a227"/>
  <path d="${dome(cx, 13, 206, 168)}" fill="#e8d59a"/>
  <rect x="${cx - 2}" y="150" width="4" height="18" rx="2" fill="#c9a227"/>
  <circle cx="${cx}" cy="146" r="5" fill="#c9a227"/>`;

const emblem = `
  ${minaret(150)}
  ${minaret(362)}
  <rect x="172" y="300" width="168" height="94" rx="6" fill="#e8d59a"/>
  <path d="${dome(256, 84, 300, 168)}" fill="#e8d59a"/>
  <rect x="253" y="146" width="6" height="24" rx="3" fill="#c9a227"/>
  <circle cx="256" cy="132" r="17" fill="#c9a227"/>
  <circle cx="263" cy="127" r="14" fill="#0f5132"/>
  <path d="M236 394 L236 348 Q256 326 276 348 L276 394 Z" fill="#0f5132"/>`;

const withBg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#157f54"/><stop offset="0.55" stop-color="#0f5132"/><stop offset="1" stop-color="#07271d"/>
  </linearGradient></defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${emblem}
</svg>`;

// Transparent emblem for the splash (app.json paints the green behind it).
const transparent = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">${emblem}</svg>`;

async function main() {
  await mkdir(OUT, { recursive: true });
  await sharp(Buffer.from(withBg)).resize(1024, 1024).png().toFile(path.join(OUT, "icon.png"));
  await sharp(Buffer.from(withBg)).resize(1024, 1024).png().toFile(path.join(OUT, "adaptive-icon.png"));
  await sharp(Buffer.from(transparent)).resize(1024, 1024).png().toFile(path.join(OUT, "splash-icon.png"));
  await sharp(Buffer.from(withBg)).resize(48, 48).png().toFile(path.join(OUT, "favicon.png"));
  console.log("✓ mobile assets: icon, adaptive-icon, splash-icon, favicon");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
