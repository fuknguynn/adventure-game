// Post-Qwen verification: movement proof via frame differencing (no debug handles;
// they were cleaned up). Walks blind, compares frames, checks errors.
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync, readFileSync } from 'node:fs';
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
  return readFileSync(p);
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
await sleep(14000);
const a = await snap('qwen-00-spawn.png');
await page.keyboard.down('KeyW');
await sleep(4000);
const b = await snap('qwen-01-walk.png');
await page.keyboard.up('KeyW');
let diff = 0;
const n = Math.min(a.length, b.length);
for (let i = 0; i < n; i += 101) if (a[i] !== b[i]) diff++;
const ratio = diff / (n / 101);
console.log('frame-diff walk vs spawn: ' + ratio.toFixed(3) + (ratio > 0.05 ? ' (MOVED)' : ' (STATIC!)'));
await page.keyboard.press('Space');
await sleep(2500);
await snap('qwen-02-after.png');
await browser.close();
if (ratio <= 0.05) errors.push('NO MOVEMENT: frames identical');
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'QWEN TREE VERIFIED: MOVES, NO ERRORS');
process.exit(errors.length ? 1 : 0);
