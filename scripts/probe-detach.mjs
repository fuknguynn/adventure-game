// Detach probe (critical bug): logs body vs visible-mesh vs dot world positions
// across idle/walk/strafe/sprint/jump/orbit/rapid, asserts visual offset stays small.
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync } from 'node:fs';
mkdirSync('shots', { recursive: true });
const errors = [];
const browser = await puppeteer.launch({
  executablePath: process.env.EDGE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=1440,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const snap = async (n) => { const p = 'shots/' + n; try { unlinkSync(p); } catch {} await page.screenshot({ path: p }); };
const read = () => page.evaluate(() => window.__eldergrove.debugBody());
const dist = (a, b) => (a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : NaN);
let maxGap = 0;
async function check(tag, ms) {
  if (ms) await sleep(ms);
  const info = await page.evaluate(() => ({
    body: window.__eldergrove ? window.__eldergrove.debugBody() : 'NO-HANDLE',
    canvases: document.querySelectorAll('canvas').length,
  }));
  const r = info.body;
  if (r === 'NO-HANDLE' || !r || !r.body || !r.visual) {
    console.log(tag + ' INCOMPLETE: ' + JSON.stringify(r) + ' canvases=' + info.canvases);
    return r;
  }
  const gap = dist(r.body, r.visual);
  maxGap = Math.max(maxGap, gap);
  const flag = gap > 0.6 ? '  <-- DESYNC' : '';
  console.log(tag + ' body=[' + r.body + '] visual=[' + r.visual + '] gap=' + gap.toFixed(3) + flag);
  return r;
}
await page.goto('http://localhost:5177/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate((charId) => {
  localStorage.setItem('eldergrove.save.v1', JSON.stringify({
    schemaVersion: 1,
    profile: { displayName: 'Ray', characterId: charId },
    progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false },
    settings: { quality: 'low', musicVolume: 0, sfxVolume: 0, reducedMotion: false },
    updatedAt: new Date().toISOString(),
  }));
}, process.env.CHAR || 'knight');
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2000);
await page.click('text/Continue Adventure');
// Rapier WASM + 20 GLBs + 2 anim packs under SwiftShader: wait for the body
await page.waitForFunction(
  () => { const g = window.__eldergrove; return g && g.debugBody && g.debugBody().body !== null; },
  { timeout: 90000 },
);
// key-delivery check: does the page itself see keydown?
await page.evaluate(() => {
  window.__keysSeen = [];
  window.addEventListener('keydown', (e) => window.__keysSeen.push(e.code));
  window.addEventListener('keyup', (e) => window.__keysSeen.push('up:' + e.code));
});
await check('spawn', 1000);
await snap('detach-00-spawn.png');
await page.keyboard.down('KeyW');
await check('walk 2s', 2000);
const keysSeen = await page.evaluate(() => window.__keysSeen);
console.log('keydown events delivered to page: ' + JSON.stringify(keysSeen));
await check('walk 5s', 3000);
await snap('detach-01-walk.png');
await page.keyboard.down('KeyA');
await check('strafe', 1500);
await page.keyboard.up('KeyA');
await page.keyboard.down('ShiftLeft');
await check('sprint', 2000);
await page.keyboard.press('Space');
await check('jump', 400);
await check('landed', 1500);
await page.keyboard.up('KeyW');
await page.keyboard.up('ShiftLeft');
// orbit while moving
await page.keyboard.down('KeyW');
const c = await page.$('canvas');
const bb = await c.boundingBox();
await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await page.mouse.down();
await page.mouse.move(bb.x + 250, bb.y + 40, { steps: 12 });
await page.mouse.up();
await check('orbit+walk', 1200);
await page.keyboard.up('KeyW');
// rapid direction changes
for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyW', 'KeyD']) {
  await page.keyboard.down(k); await sleep(400); await page.keyboard.up(k);
  await check('rapid ' + k, 0);
}
await snap('detach-02-final.png');
await browser.close();
console.log('max body↔visual gap: ' + maxGap.toFixed(3) + 'm');
if (maxGap > 0.6) errors.push('DESYNC: visual separated from body by ' + maxGap.toFixed(3) + 'm');
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ATTACHED, NO ERRORS');
process.exit(errors.length ? 1 : 0);
