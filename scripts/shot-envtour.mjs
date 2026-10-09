// Visual tour of the environment branch: spawn, orbit views, short walks,
// mobile. Records console/page/HTTP errors. Read-only vs game code.
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync } from 'node:fs';
mkdirSync('shots', { recursive: true });
const errors = [];
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=1440,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
page.on('response', (r) => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ': ' + r.url()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function snap(n) {
  const p = 'shots/' + n;
  try { unlinkSync(p); } catch {}
  await page.screenshot({ path: p });
  console.log('shot ' + n);
}
async function orbit(dx) {
  const c = await page.$('canvas');
  const bb = await c.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2 + dx, bb.y + bb.height / 2, { steps: 14 });
  await page.mouse.up();
  await sleep(1200);
}
await page.goto('http://localhost:5177/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => {
  localStorage.setItem('eldergrove.save.v1', JSON.stringify({
    schemaVersion: 1,
    profile: { displayName: 'Ray', characterId: 'knight' },
    progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false },
    settings: { quality: 'low', musicVolume: 0, sfxVolume: 0, reducedMotion: true },
    updatedAt: new Date().toISOString(),
  }));
});
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2000);
await page.click('text/Continue Adventure');
await sleep(14000);
await snap('env-01-spawn.png');
await orbit(500);
await snap('env-02-east.png');
await orbit(-950);
await snap('env-03-west.png');
// walk north up the entry path
await page.keyboard.down('KeyW');
await sleep(6000);
await page.keyboard.up('KeyW');
await sleep(1000);
await snap('env-04-path.png');
await orbit(400);
await snap('env-05-village.png');
// mobile
const m = await browser.newPage();
await m.setViewport({ width: 390, height: 844 });
m.on('pageerror', (e) => errors.push('M-PAGEERROR: ' + e.message));
await m.goto('http://localhost:5177/', { waitUntil: 'networkidle0', timeout: 60000 });
await sleep(1500);
await m.click('text/Continue Adventure');
await sleep(14000);
await m.screenshot({ path: 'shots/env-06-mobile.png' });
console.log('shot env-06-mobile.png');
await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ENV TOUR CLEAN, NO ERRORS');
process.exit(errors.length ? 1 : 0);
