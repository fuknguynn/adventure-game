// Clean animation portraits: short walks near spawn (open ground), jump on cue.
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
async function snap(name) {
  const path = 'shots/' + name;
  try { unlinkSync(path); } catch {}
  await page.screenshot({ path });
}
await page.goto('http://localhost:5177/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => {
  localStorage.setItem('eldergrove.save.v1', JSON.stringify({
    schemaVersion: 1,
    profile: { displayName: 'Ray', characterId: 'knight' },
    progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false },
    settings: { quality: 'low', musicVolume: 0, sfxVolume: 0, reducedMotion: false },
    updatedAt: new Date().toISOString(),
  }));
});
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2000);
await page.click('text/Continue Adventure');
await sleep(12000);
// short walk, stay in the open near spawn
await page.keyboard.down('KeyW');
await sleep(1500);
await snap('anim-08-walk-open.png');
await page.keyboard.up('KeyW');
await sleep(800);
// jump on cue: press, then shoot the moment telemetry says airborne
await page.keyboard.press('Space');
let air = false;
for (let i = 0; i < 30; i++) {
  const g = await page.evaluate(() => window.__eldergrove.debugLoco.grounded);
  if (!g) { air = true; break; }
  await sleep(50);
}
console.log('airborne detected:', air);
await snap('anim-09-jump-open.png');
await sleep(1500);
await snap('anim-10-landed-open.png');
await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'CLEAN, NO ERRORS');
process.exit(errors.length ? 1 : 0);
