import { createRequire } from "module";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");

const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const base = process.env.BASE || "http://localhost:3000";
const EMAIL = "admin@kingstonmosque.org";
const PASSWORD = "Masjid2026!";

const browser = await chromium.launch({
  executablePath: exe,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--force-color-profile=srgb", "--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });

// Login
await page.goto(base + "/admin/login", { waitUntil: "networkidle", timeout: 60000 });
await page.fill("#field-email", EMAIL);
await page.fill("#field-password", PASSWORD);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);
await page.waitForLoadState("networkidle").catch(() => {});

async function shot(path, file, full = false) {
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => console.warn("nav", path, e.message));
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `docs/${file}.png`, fullPage: full });
  console.log("✅ docs/" + file + ".png  (" + path + ")");
}

await shot("/admin", "admin-dashboard");
await shot("/admin/collections/events", "admin-events");
await shot("/admin/collections/prayer-days/1", "admin-prayer-day", true);
await shot("/admin/globals/jummah-settings", "admin-jummah", true);

await browser.close();
