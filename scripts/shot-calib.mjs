// Calibration: dialogue closed, daylight frozen, short legs with dense shots
// to measure true heading/speed/blockage before zone attempts.
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync } from 'node:fs';
mkdirSync('shots', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=1440,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function snap(n) {
  const p = 'shots/' + n;
  try { unlinkSync(p); } catch {}
  await page.screenshot({ path: p });
  console.log('shot ' + n);
}
await page.goto('http://localhost:5178/', { waitUntil: 'networkidle0', timeout: 60000 });
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
await sleep(12000);
await snap('cal-00-spawn.png');
// walk W 6s, shots every 2s
await page.keyboard.down('KeyW');
for (let i = 1; i <= 3; i++) { await sleep(2000); await snap('cal-W' + i + '.png'); }
await page.keyboard.up('KeyW');
// walk D 6s, shots every 2s
await page.keyboard.down('KeyD');
for (let i = 1; i <= 3; i++) { await sleep(2000); await snap('cal-D' + i + '.png'); }
await page.keyboard.up('KeyD');
// sprint W+D 6s (grove-bound direction guess)
await page.keyboard.down('ShiftLeft');
await page.keyboard.down('KeyW');
await page.keyboard.down('KeyD');
for (let i = 1; i <= 3; i++) { await sleep(2000); await snap('cal-WD' + i + '.png'); }
await page.keyboard.up('KeyW');
await page.keyboard.up('KeyD');
await page.keyboard.up('ShiftLeft');
await browser.close();
console.log('CALIBRATION DONE');
