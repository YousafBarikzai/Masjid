import { createRequire } from "module";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");

const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const base = process.env.BASE || "http://localhost:3000";

const targets = [
  { path: "/", name: "live-home" },
  { path: "/prayer-times", name: "live-prayer-times" },
];

const browser = await chromium.launch({
  executablePath: exe,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--force-color-profile=srgb", "--hide-scrollbars"],
});

async function shot(url, file, width, height, dsf) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dsf });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
  } catch (e) {
    console.warn("goto warn", url, e.message);
  }
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `docs/${file}.png`, fullPage: true });
  console.log("✅ docs/" + file + ".png");
  await page.close();
}

for (const t of targets) {
  await shot(base + t.path, t.name + "-desktop", 1366, 900, 1.5);
}
await shot(base + "/", "live-home-mobile", 390, 844, 2);
await browser.close();
