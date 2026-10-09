// Trail recon: grove corridor only, screenshot every 3rd step.
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync } from 'node:fs';
mkdirSync('shots', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=960,540'],
});
const page = await browser.newPage();
await page.setViewport({ width: 960, height: 540 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let yaw = 0.6;
async function face(dx, dz) {
  const target = Math.atan2(-dx, -dz);
  let d = target - yaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  if (Math.abs(d) < 0.03) return;
  const px = -d / 0.005;
  const c = await page.$('canvas');
  const bb = await c.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2 + px, bb.y + bb.height / 2, { steps: 12 });
  await page.mouse.up();
  yaw = target;
  await sleep(600);
}
await page.goto('http://localhost:5178/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });
await sleep(1500);
await page.click('text/New Adventure');
await page.waitForSelector('[data-testid="name-input"]', { timeout: 15000 });
await sleep(2000);
await page.type('[data-testid="name-input"]', 'Ray');
await sleep(300);
await page.click('[data-testid="enter-forest"]');
await sleep(2000);
const skip = await page.$('text/Skip');
if (skip) await skip.click();
await sleep(12000);
const WPS = [[0, 6], [0, -1], [2, -8], [9, -14], [18, -19], [28, -22]];
let cur = WPS[0], n = 0;
for (let w = 1; w < WPS.length; w++) {
  const [tx, tz] = WPS[w];
  for (;;) {
    const dx = tx - cur[0], dz = tz - cur[1];
    const d = Math.hypot(dx, dz);
    if (d < 2) break;
    await face(dx / d, dz / d);
    const step = Math.min(2.5, d);
    await page.keyboard.down('KeyW');
    await sleep(Math.round((step / 1.2) * 1000));
    await page.keyboard.up('KeyW');
    cur = [cur[0] + (dx / d) * step, cur[1] + (dz / d) * step];
    n++;
    if (n % 3 === 0) {
      const p = 'shots/trail-' + String(n).padStart(2, '0') + '.png';
      try { unlinkSync(p); } catch {}
      await page.screenshot({ path: p });
      console.log('trail ' + n + ' est [' + cur.map((v) => v.toFixed(0)) + ']');
    }
    await page.keyboard.press('KeyE');
    await sleep(700);
  }
  cur = [tx, tz];
}
await browser.close();
console.log('TRAIL DONE');
