// Speed probe: hold sprint-W 12s, screenshots + rAF fps measurement.
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
await page.goto('http://localhost:5178/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });
await sleep(1500);
await page.click('text/New Adventure');
await page.waitForSelector('[data-testid="name-input"]', { timeout: 15000 });
await sleep(2000);
await page.type('[data-testid="name-input"]', 'Ray');
await sleep(500);
await page.click('[data-testid="enter-forest"]');
await sleep(2000);
const skip = await page.$('text/Skip');
if (skip) await skip.click();
await sleep(12000);
await page.screenshot({ path: 'shots/sp-00.png' });
// fps over 5s idle
const fps = await page.evaluate(() => new Promise((res) => {
  let n = 0; const t0 = performance.now();
  const loop = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(loop); else res((n / 5).toFixed(1)); };
  requestAnimationFrame(loop);
}));
console.log('rAF fps: ' + fps);
await page.keyboard.down('ShiftLeft');
await page.keyboard.down('KeyW');
for (let i = 1; i <= 4; i++) {
  await sleep(3000);
  try { unlinkSync('shots/sp-0' + i + '.png'); } catch {}
  await page.screenshot({ path: 'shots/sp-0' + i + '.png' });
  console.log('shot sp-0' + i);
}
await page.keyboard.up('KeyW');
await page.keyboard.up('ShiftLeft');
await browser.close();
console.log('SPEED PROBE DONE');
