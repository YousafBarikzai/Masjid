/**
 * Generate PWA app icons from a hand-built SVG emblem (gold mosque dome,
 * minarets and crescent on the house green). Pure SVG → PNG via sharp, so there
 * is no binary art to maintain. Run: `node scripts/generate-icons.mjs`.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/icons");

// Pointed dome path in the same style as the site's MosqueSkyline.
const dome = (cx, hw, by, py) =>
  `M${cx - hw} ${by} Q${cx - hw} ${py} ${cx} ${py} Q${cx + hw} ${py} ${cx + hw} ${by} Z`;

const minaret = (cx) => `
  <rect x="${cx - 13}" y="206" width="26" height="188" rx="4" fill="#e8d59a"/>
  <rect x="${cx - 18}" y="236" width="36" height="9" rx="3" fill="#c9a227"/>
  <path d="${dome(cx, 13, 206, 168)}" fill="#e8d59a"/>
  <rect x="${cx - 2}" y="150" width="4" height="18" rx="2" fill="#c9a227"/>
  <circle cx="${cx}" cy="146" r="5" fill="#c9a227"/>`;

// Emblem kept inside the central ~62% so it survives maskable cropping.
const emblem = `
  ${minaret(150)}
  ${minaret(362)}
  <!-- main building base -->
  <rect x="172" y="300" width="168" height="94" rx="6" fill="#e8d59a"/>
  <!-- main dome -->
  <path d="${dome(256, 84, 300, 168)}" fill="#e8d59a"/>
  <!-- finial + crescent -->
  <rect x="253" y="146" width="6" height="24" rx="3" fill="#c9a227"/>
  <circle cx="256" cy="132" r="17" fill="#c9a227"/>
  <circle cx="263" cy="127" r="14" fill="#0f5132"/>
  <!-- doorway -->
  <path d="M236 394 L236 348 Q256 326 276 348 L276 394 Z" fill="#0f5132"/>`;

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#157f54"/>
      <stop offset="0.55" stop-color="#0f5132"/>
      <stop offset="1" stop-color="#07271d"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${emblem}
</svg>`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const buf = Buffer.from(svg(512));
  const jobs = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "icon-maskable-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
  ];
  for (const j of jobs) {
    await sharp(buf).resize(j.size, j.size).png().toFile(path.join(OUT, j.name));
    console.log("✓", j.name);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
