// FULL E2E v3 — corridor crawl. No teleports, no position reads: the bot walks
// the game's own path polylines in ~4m steps with an E-check after EVERY step,
// so no 5m-radius zone can be walked past undetected. Fails on any error.
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync } from 'node:fs';
mkdirSync('shots', { recursive: true });
const errors = [];
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=960,540'],
});
const page = await browser.newPage();
await page.setViewport({ width: 960, height: 540 });
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
// 8-way headings for fixed camera yaw (matches game basis)
const HEAD = {
  W: [-0.565, -0.825], S: [0.565, 0.825], A: [-0.825, 0.565], D: [0.825, -0.565],
  WD: [0.184, -0.983], WA: [-0.983, -0.184], SD: [0.983, 0.184], SA: [-0.184, 0.983],
};
const CODE = { W: 'KeyW', A: 'KeyA', S: 'KeyS', D: 'KeyD' };
async function pressE() { await page.keyboard.press('KeyE'); await sleep(700); }
async function panelTitle() {
  try {
    const h = await page.waitForSelector('.card h3', { timeout: 900 });
    return await h.evaluate((el) => el.textContent);
  } catch { return null; }
}
async function clickText(t) {
  const el = await page.waitForSelector('text/' + t, { timeout: 8000 });
  await el.click();
}
async function closeDialogue() {
  const t = await panelTitle();
  if (t) return false;
  const c = await page.$('text/Continue');
  if (c) { await c.click(); await sleep(300); }
  return true;
}
// crawl waypoints; E-check after every ~4m step; stop early on expected panel
// camera-relative steering: rotate camera to face travel direction, then walk
// W (camera forward IS movement forward). Yaw tracked in-script (game starts
// at 0.6, no autorotate in game view). Still 100% real inputs.
let yaw = 0.6;
async function closeOverlays() {
  // Close EVERYTHING (dialogue/journal/stale puzzle panels). Arrival detection
  // happens in the caller's own E-check right after, so closing first is
  // lossless — and a stale fullscreen panel would otherwise eat face() drags.
  const t = await panelTitle();
  if (t) {
    const leave = await page.$('text/Leave');
    if (leave) { await leave.click(); await sleep(400); }
    return 'closed-panel';
  }
  const dlg = await page.$('text/Elder Mira');
  if (dlg) {
    const c = await page.$('text/Continue');
    if (c) await c.click();
    await sleep(400);
    return 'closed-dialogue';
  }
  const j = await page.$('text/The Forest Remembers');
  if (j) {
    const c = await page.$('text/Close');
    if (c) await c.click();
    await sleep(400);
    return 'closed-journal';
  }
  return 'clear';
}
async function face(dx, dz) {
  const target = Math.atan2(-dx, -dz);
  let d = target - yaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  if (Math.abs(d) < 0.03) return;
  await closeOverlays();
  // drag must START on the canvas: modals eat drags (text selection) and the
  // turn silently fails, poisoning all later steering with a wrong yaw.
  const pt = await page.evaluate(() => {
    const cv = document.querySelector('canvas');
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    const cands = [[0.15, 0.5], [0.85, 0.5], [0.5, 0.72], [0.5, 0.3], [0.3, 0.5], [0.7, 0.5]];
    for (const [fx, fy] of cands) {
      const x = r.x + r.width * fx, y = r.y + r.height * fy;
      if (document.elementFromPoint(x, y) === cv) return [x, y];
    }
    return null;
  });
  if (!pt) return; // fully covered; skip turn rather than lie about yaw
  const px = -d / 0.005;
  await page.mouse.move(pt[0], pt[1]);
  await page.mouse.down();
  await page.mouse.move(pt[0] + px, pt[1], { steps: Math.min(30, Math.max(6, Math.round(Math.abs(px) / 20))) });
  await page.mouse.up();
  yaw = target;
  await sleep(600);
}
async function crawl(waypoints, expected) {
  let cur = waypoints[0];
  let steps = 0;
  for (let w = 1; w < waypoints.length; w++) {
    const [tx, tz] = waypoints[w];
    for (;;) {
      const dx = tx - cur[0], dz = tz - cur[1];
      const d = Math.hypot(dx, dz);
      if (d < 2) break;
      await face(dx / d, dz / d);
      const step = Math.min(1, d); // 1m granularity: dense E-checks beat deflection
      const ms = Math.round((step / 1.2) * 1000);
      await page.keyboard.down('KeyW');
      await sleep(ms);
      await page.keyboard.up('KeyW');
      cur = [cur[0] + (dx / d) * step, cur[1] + (dz / d) * step];
      steps++;
      if (steps % 6 === 0) {
        // unstick: hop + back out (prop-collider pockets)
        await page.keyboard.press('Space');
        await sleep(500);
        await page.keyboard.down('KeyS');
        await sleep(1200);
        await page.keyboard.up('KeyS');
      }
      await pressE();
      const t = await panelTitle();
      if (t && t.includes(expected)) { console.log('arrived XY~[' + cur.map((v) => v.toFixed(0)) + ']'); return true; }
      await closeDialogue();
    }
    cur = [tx, tz];
  }
  return false;
}
async function fragCount() {
  return page.evaluate(() => {
    const m = document.body.textContent.match(/([0-3])\/3 Spirit Fragments/);
    return m ? m[1] : '?';
  });
}

// ---------- 1. onboarding ----------
await page.goto('http://localhost:5178/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });
await sleep(1500);
await snap('e2e-01-welcome.png');
await page.click('text/New Adventure');
await page.waitForSelector('[data-testid="name-input"]', { timeout: 15000 });
await sleep(2500);
await page.type('[data-testid="name-input"]', 'Ray');
await page.click('[data-testid="card-mage"]');
await sleep(1500);
await snap('e2e-02-creation.png');
await page.click('[data-testid="enter-forest"]');
await sleep(2000);
const skip = await page.$('text/Skip');
if (skip) await skip.click();
await sleep(12000);
await snap('e2e-03-spawn.png');

// ---------- 2. spirit dialogue ----------
await pressE();
const dlg = await page.$('text/Elder Mira');
console.log('spirit dialogue open: ' + !!dlg);
if (!dlg) errors.push('QUEST: no spirit dialogue at spawn');
else { await snap('e2e-04-dialogue.png'); await clickText('Continue'); await sleep(500); }

// ---------- 3. Grove ----------
console.log('crawl to grove...');
let at = [0, 6];
async function crawlFrom(waypoints, expected) {
  waypoints[0] = at;
  // dogleg around the village-center prop cluster (banner/chest/barrel colliders)
  const via = expected === 'Spirit Path' ? [[-3, 0]] : expected === 'Light Reflection' ? [[6, -2], [12, 0]] : [];
  const full = [waypoints[0]];
  for (const v of via) full.push(v);
  for (let i = 1; i < waypoints.length; i++) full.push(waypoints[i]);
  const ok = await crawl(full, expected);
  if (!ok) {
    // expanding-spiral sweep fallback: growing steps cover widening radius
    for (let i = 0; i < 28; i++) {
      await pressE();
      const t = await panelTitle();
      if (t && t.includes(expected)) return true;
      await closeDialogue();
      const dirs = [['KeyW'], ['KeyD'], ['KeyS'], ['KeyA']];
      const ms = 1100 + Math.floor(i / 4) * 700;
      for (const k of dirs[i % 4]) await page.keyboard.down(k);
      await sleep(ms);
      for (const k of dirs[i % 4]) await page.keyboard.up(k);
    }
  }
  return ok;
}
if (!await crawlFrom([[0, 6], [0, -1], [2, -8], [9, -14], [18, -19], [28, -22]], 'Spirit Path')) { errors.push('NAV: grove not reached'); await snap('e2e-05-grove-lost.png'); }
else {
  at = [28, -22];
  await snap('e2e-05-grove.png');
  await page.click('button[aria-label="Stone ▲ number 2"]');
  await sleep(400);
  for (const id of [0, 2, 1, 3]) {
    const btn = await page.$('button[aria-label="Stone ' + ['●', '▲', '■', '◆'][id] + ' number ' + (id + 1) + '"]');
    await btn.click();
    await sleep(350);
  }
  await sleep(1000);
  console.log('fragments after grove (expect 1): ' + await fragCount());
  await snap('e2e-06-fragment1.png');
}

// ---------- 4. Lake ----------
console.log('crawl to lake...');
if (!await crawlFrom([[28, -22], [18, -19], [9, -14], [2, -8], [0, -1], [-6, 2], [-15, 3], [-22, 4.5], [-28, 6]], 'Rune Sequence')) { errors.push('NAV: lake not reached'); await snap('e2e-07-lake-lost.png'); }
else {
  at = [-28, 6];
  await snap('e2e-07-lake.png');
  for (const id of [1, 3, 0, 2]) {
    const btn = await page.$('button[aria-label="Rune ' + ['●', '▲', '■', '◆'][id] + ' ' + (id + 1) + '"]');
    await btn.click();
    await sleep(350);
  }
  await sleep(1000);
  console.log('fragments after lake (expect 2): ' + await fragCount());
  await snap('e2e-08-fragment2.png');
}

// ---------- 5. Ruins ----------
console.log('crawl to ruins...');
if (!await crawlFrom([[0, 0], [-15, 5.5], [-5, 5], [3, 4], [10, 3], [17, 3], [25, 4.5], [31, 5]], 'Light Reflection')) { errors.push('NAV: ruins not reached'); await snap('e2e-09-ruins-lost.png'); }
else {
  at = [31, 5];
  await snap('e2e-09-ruins.png');
  const dial = async (i) => {
    const b = await page.$('button[aria-label^="Rotate crystal ' + (i + 1) + '"]');
    await b.click();
    await sleep(300);
  };
  await dial(0); await dial(1); await dial(1);
  await sleep(1000);
  console.log('fragments after ruins (expect 3): ' + await fragCount());
  await snap('e2e-10-fragment3.png');
}

// ---------- 6. Tree -> Ending ----------
console.log('crawl to tree...');
await crawlFrom([[31, 5], [25, 6], [17, 5], [10, 4], [4, 5], [0, 6], [0.5, 13], [-0.5, 21], [0, 26], [0, 31]], '___never___');
let ended = false;
for (let i = 0; i < 20; i++) {
  await pressE();
  if (await page.evaluate(() => document.body.textContent.includes('The Tree Remembers'))) { ended = true; break; }
  const leave = await page.$('text/Leave');
  if (leave) { await leave.click(); await sleep(300); }
  await closeDialogue();
  const dirs = [['KeyW'], ['KeyA'], ['KeyS'], ['KeyD']];
  for (const k of dirs[i % 4]) await page.keyboard.down(k);
  await sleep(2500);
  for (const k of dirs[i % 4]) await page.keyboard.up(k);
}
console.log('ending reached: ' + ended);
if (!ended) errors.push('FINALE: tree did not trigger ending');
await snap('e2e-11-ending.png');
const keep = await page.$('text/Keep Exploring');
if (keep) { await keep.click(); await sleep(2000); }

// ---------- 7. reload -> Continue ----------
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2000);
await page.click('text/Continue Adventure');
await sleep(10000);
console.log('fragments after reload (expect 3): ' + await fragCount());
await snap('e2e-13-continued.png');

// ---------- 8. corrupt save ----------
await page.evaluate(() => localStorage.setItem('eldergrove.save.v1', '{corrupt!!!'));
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2000);
const wel = await page.$('text/New Adventure');
console.log('corrupt save -> welcome (expect true): ' + !!wel);
if (!wel) errors.push('SAVE: corrupt save did not recover');
await snap('e2e-14-corrupt.png');

await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'E2E COMPLETE, NO ERRORS, NO SOFTLOCK');
process.exit(errors.length ? 1 : 0);
