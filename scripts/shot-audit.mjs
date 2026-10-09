// Full-loop audit on current HEAD: onboarding → spawn → move → dialogue (E) →
// journal (J) → map (M) → pause (Esc) → photo → mobile. Fails on any error.
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
async function snap(n) {
  const p = 'shots/' + n;
  try { unlinkSync(p); } catch {}
  await page.screenshot({ path: p });
  console.log('shot ' + n);
}
await page.goto('http://localhost:5178/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });
await sleep(1500);
await snap('audit-01-welcome.png');
await page.click('text/New Adventure');
await page.waitForSelector('[data-testid="name-input"]', { timeout: 15000 });
await sleep(3000);
const dis1 = await page.$eval('[data-testid="enter-forest"]', (b) => b.disabled);
console.log('enter disabled with empty name (expect true): ' + dis1);
if (!dis1) errors.push('VALIDATION: enter enabled with empty name');
await page.type('[data-testid="name-input"]', 'Ray');
await page.click('[data-testid="card-rogue"]');
await sleep(2000);
await snap('audit-02-creation.png');
const dis2 = await page.$eval('[data-testid="enter-forest"]', (b) => b.disabled);
console.log('enter disabled with valid name (expect false): ' + dis2);
if (dis2) errors.push('VALIDATION: enter disabled with valid name');
await page.click('[data-testid="enter-forest"]');
await sleep(2500);
await snap('audit-03-cinematic.png');
const skip = await page.$('text/Skip');
if (skip) await skip.click();
await sleep(12000);
await snap('audit-04-spawn.png');
await page.keyboard.down('KeyW');
await sleep(3000);
await snap('audit-05-walk.png');
await page.keyboard.up('KeyW');
await page.keyboard.press('KeyE');
await sleep(1200);
await snap('audit-06-dialogue.png');
const dlg = await page.$('text/Continue');
if (dlg) { await dlg.click(); await sleep(500); } else errors.push('DIALOGUE: no Continue button after E');
await page.keyboard.press('KeyJ');
await sleep(800);
await snap('audit-07-journal.png');
await page.keyboard.press('KeyM');
await sleep(800);
await snap('audit-08-map.png');
await page.keyboard.press('KeyM');
await sleep(500);
await page.keyboard.press('Escape');
await sleep(800);
await snap('audit-09-pause.png');
const resume = await page.$('text/Resume');
if (resume) { await resume.click(); await sleep(500); } else errors.push('PAUSE: no Resume button');
const photo = await page.$('button[aria-label="Open photo mode"]');
if (photo) {
  await photo.click();
  await sleep(800);
  await snap('audit-10-photo.png');
  const exit = await page.$('text/Exit');
  if (exit) await exit.click();
} else errors.push('PHOTO: button missing');
const m = await browser.newPage();
await m.setViewport({ width: 390, height: 844 });
m.on('pageerror', (e) => errors.push('M-PAGEERROR: ' + e.message));
await m.goto('http://localhost:5178/', { waitUntil: 'networkidle0', timeout: 60000 });
await sleep(1500);
await m.click('text/New Adventure');
await m.waitForSelector('[data-testid="name-input"]', { timeout: 15000 });
await sleep(4000);
await snap('audit-11-mobile.png');
await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'AUDIT CLEAN, NO ERRORS');
process.exit(errors.length ? 1 : 0);
