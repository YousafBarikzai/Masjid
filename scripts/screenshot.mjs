import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const fileUrl = 'file://' + process.cwd() + '/docs/home-preview.html';
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'],
});

async function shot(name, width, height, deviceScaleFactor) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor });
  try {
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 15000 });
  } catch (e) {
    console.warn('goto warning:', e.message);
  }
  // give web fonts + the countdown a moment, then settle
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `docs/${name}`, fullPage: true });
  console.log('✅ wrote docs/' + name);
  await page.close();
}

await shot('preview-desktop.png', 1366, 900, 1.5);
await shot('preview-mobile.png', 390, 844, 2);
await browser.close();
