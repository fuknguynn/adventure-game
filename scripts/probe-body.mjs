// Probe body trajectory: reports playerPos + loco while walking blind.
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 600 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
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
await new Promise((r) => setTimeout(r, 2000));
await page.click('text/Continue Adventure');
await new Promise((r) => setTimeout(r, 10000));
const read = () => page.evaluate(() => {
  const g = window.__eldergrove;
  return g ? { p: [g.playerPos.x, g.playerPos.y, g.playerPos.z].map((v) => +v.toFixed(2)), s: g.debugLoco.state } : null;
});
console.log('spawn:', JSON.stringify(await read()));
await page.keyboard.down('KeyW');
for (let i = 0; i < 10; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  console.log('walk+' + (i + 1) + 's:', JSON.stringify(await read()));
}
await page.keyboard.up('KeyW');
await browser.close();
console.log(errs.length ? 'PAGEERRORS: ' + errs.join(' | ') : 'no page errors');
