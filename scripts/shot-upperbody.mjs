// Upper-body verification matrix: 3 chars x (idle/walk/run/jump) x azimuths.
// Serves public/anim-lab.html (temporary rig, deleted before release).
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync } from 'node:fs';
mkdirSync('shots/upper', { recursive: true });
const errors = [];
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=900,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900 });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const plan = [];
for (const char of ['knight', 'mage', 'rogue']) {
  plan.push([char, 'Idle_A', 0.5, 0], [char, 'Idle_A', 0.5, 90]);
  plan.push([char, 'Walking_A', 0.25, 0], [char, 'Walking_A', 0.25, 45], [char, 'Walking_A', 0.25, 90]);
  plan.push([char, 'Running_A', 0.25, 0], [char, 'Running_A', 0.25, 90]);
  plan.push([char, 'Jump_Start', 0.35, 0], [char, 'Jump_Start', 0.35, 90]);
}
const WIDE = '&wide=2.1';
for (const [char, clip, t, az] of plan) {
  const name = char + '-' + clip + '-az' + az + '.png';
  await page.goto('http://localhost:5177/anim-lab.html?char=' + char + '&clip=' + clip + '&t=' + t + '&az=' + az + (clip === 'Idle_A' ? '' : WIDE), { waitUntil: 'networkidle0', timeout: 60000 });
  try {
    await page.waitForFunction('window.__ready === true', { timeout: 20000 });
  } catch { errors.push('TIMEOUT: ' + name); continue; }
  await sleep(400);
  const p = 'shots/upper/' + name;
  try { unlinkSync(p); } catch {}
  await page.screenshot({ path: p });
  console.log('shot ' + name);
}
await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'MATRIX COMPLETE, NO ERRORS');
process.exit(errors.length ? 1 : 0);
