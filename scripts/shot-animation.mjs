// Runtime verification for locomotion: seeds a save, enters via Continue,
// exercises idle/walk/strafe/sprint/jump/rapid-switches, asserts mixer states
// via window.__eldergrove, captures frame sequences, fails on any error.
// Run: node scripts/shot-animation.mjs  (dev server must be on :5177)
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync } from 'node:fs';

const SHOTS = 'shots';
mkdirSync(SHOTS, { recursive: true });
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
  const path = SHOTS + '/' + name;
  for (let i = 0; i < 4; i++) {
    try {
      try { unlinkSync(path); } catch { /* absent — try anyway */ }
      await page.screenshot({ path });
      return;
    } catch (e) {
      if (i === 3) throw e;
      await sleep(700);
    }
  }
}
const detail = () => page.evaluate(() => {
  const d = window.__eldergrove ? window.__eldergrove.debugLoco : null;
  return d ? d.state + ' (spd ' + d.speed + ', gnd ' + d.grounded + ')' : 'NO-HANDLE';
});
const rawState = () => page.evaluate(() => (window.__eldergrove ? window.__eldergrove.debugLoco.state : 'NO-HANDLE'));
const seen = new Set();
async function sample(tag, ms) {
  if (ms) await sleep(ms);
  seen.add(await rawState());
  console.log(tag + ': ' + await detail());
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
await snap('anim-00-spawn.png');

// idle 10s
await sample('idle t0', 0);
await snap('anim-01-idle-a.png');
await sample('idle t5', 5000);
await snap('anim-01-idle-b.png');
await sample('idle t10', 5000);

// walk forward + frames
await page.keyboard.down('KeyW');
await sample('walk+1s', 1000);
await snap('anim-02-walk-a.png');
await sample('walk+2s', 1000);
await snap('anim-02-walk-b.png');
// strafe left while walking
await page.keyboard.down('KeyA');
await sample('strafe', 1500);
await snap('anim-03-strafe.png');
await page.keyboard.up('KeyA');
// camera orbit while walking
const c = await page.$('canvas');
const bb = await c.boundingBox();
await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await page.mouse.down();
await page.mouse.move(bb.x + bb.width / 2 + 200, bb.y + bb.height / 2, { steps: 10 });
await page.mouse.up();
await sample('walk+orbit', 800);
await page.keyboard.up('KeyW');
// sprint
await page.keyboard.down('ShiftLeft');
await page.keyboard.down('KeyW');
await sample('sprint', 2000);
await snap('anim-04-run.png');
// jump while running (poll densely — the airborne window is short)
await page.keyboard.press('Space');
for (let i = 0; i < 8; i++) await sample('jump-air+' + (i * 100) + 'ms', 100);
await snap('anim-05-jump.png');
await sample('jump-land', 1500);
await page.keyboard.up('KeyW');
await page.keyboard.up('ShiftLeft');
// jump while stationary
await sample('still', 1200);
await page.keyboard.press('Space');
for (let i = 0; i < 8; i++) await sample('jump-still+' + (i * 100) + 'ms', 100);
await snap('anim-06-jump-still.png');
await sample('landed', 1500);
// rapid state switches
for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyW']) {
  await page.keyboard.down(k);
  await sleep(350);
  await page.keyboard.up(k);
}
await page.keyboard.down('KeyW');
await page.keyboard.press('Space');
await sample('rapid', 600);
await page.keyboard.up('KeyW');
await sample('rapid-end', 1500);
await snap('anim-07-final.png');

await browser.close();
console.log('states seen: ' + [...seen].join(', '));
const need = ['idle', 'walk', 'run', 'jump'];
const missing = need.filter((s) => !seen.has(s));
if (missing.length) errors.push('STATES MISSING: ' + missing.join(','));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'LOCOMOTION VERIFIED, NO ERRORS');
process.exit(errors.length ? 1 : 0);
