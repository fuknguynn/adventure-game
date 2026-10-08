// Real-browser verification for Character Creation overhaul.
// Drives system Chrome headless (SwiftShader WebGL), runs the full flow,
// captures desktop + mobile screenshots, fails on console/page errors.
// Run: node scripts/shot-creation.mjs  (dev server must be on :5177)
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const SHOTS = 'shots';
mkdirSync(SHOTS, { recursive: true });

const errors = [];
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=1440,900'],
});

async function newPage(width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`CONSOLE: ${m.text().slice(0, 300)}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`);
  });
  return page;
}

async function settle(page, ms = 4500) {
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, ms)); // GLB fetch + first frames
}

// --- desktop flow ---
const page = await newPage(1440, 900);
await page.goto('http://localhost:5177/', { waitUntil: 'networkidle0', timeout: 60000 });
await settle(page, 2000);
await page.screenshot({ path: `${SHOTS}/01-welcome.png` });

await page.evaluate(() => { localStorage.clear(); });
await page.reload({ waitUntil: 'networkidle0' });
await settle(page, 1500);
await page.click('text/New Adventure');
await page.waitForSelector('[data-testid="name-input"]', { timeout: 15000 });
await settle(page);
await page.screenshot({ path: `${SHOTS}/02-creation-knight.png` });

await page.type('[data-testid="name-input"]', 'Ray');
const enterDisabledEmpty = await page.$eval('[data-testid="enter-forest"]', (b) => b.disabled);
console.log('enter disabled after valid name (expect false):', enterDisabledEmpty);

for (const id of ['mage', 'rogue', 'knight']) {
  await page.click(`[data-testid="card-${id}"]`);
  await settle(page, 2500);
  await page.screenshot({ path: `${SHOTS}/03-creation-${id}.png` });
}
// rotation drag on the stage canvas
const stage = await page.$('.creation-stage canvas');
const box = await stage.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2 - 30, { steps: 12 });
await page.mouse.up();
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: `${SHOTS}/04-creation-rotated.png` });

// name preserved across switches?
const nameVal = await page.$eval('[data-testid="name-input"]', (el) => el.value);
console.log('name preserved (expect Ray):', nameVal);

// enter the forest works? (cinematic is 6s; wait generously under SwiftShader)
await page.click('[data-testid="enter-forest"]');
await new Promise((r) => setTimeout(r, 9000));
await page.screenshot({ path: `${SHOTS}/05-entered-game.png` });
await new Promise((r) => setTimeout(r, 8000));
await page.screenshot({ path: `${SHOTS}/05b-entered-game-late.png` });

// --- mobile ---
const m = await newPage(390, 844);
await m.goto('http://localhost:5177/', { waitUntil: 'networkidle0', timeout: 60000 });
await settle(m, 1500);
await m.click('text/New Adventure');
await m.waitForSelector('[data-testid="name-input"]', { timeout: 15000 });
await settle(m);
await m.screenshot({ path: `${SHOTS}/06-creation-mobile.png` });
await m.click('[data-testid="card-rogue"]');
await settle(m, 2500);
await m.screenshot({ path: `${SHOTS}/07-creation-mobile-rogue.png` });

await browser.close();
console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'NO CONSOLE/PAGE ERRORS');
process.exit(errors.length ? 1 : 0);
