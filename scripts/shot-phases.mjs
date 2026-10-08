// Decisive phase test: 8 walk phases, dump action.time + pixel-diff vs t=0.
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync, readFileSync } from 'node:fs';
mkdirSync('shots/upper', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=900,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shots = [];
for (const t of ['0', '0.125', '0.25', '0.375', '0.5', '0.625', '0.75', '0.875']) {
  await page.goto('http://localhost:5177/anim-lab.html?char=knight&clip=Walking_A&t=' + t + '&az=45&wide=2.1', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction('window.__ready === true', { timeout: 20000 });
  await sleep(300);
  const at = await page.evaluate(() => ({ t: window.__actionTime, d: window.__clipDuration, q: window.__boneQ }));
  const p = 'shots/upper/phase-' + t + '.png';
  try { unlinkSync(p); } catch {}
  await page.screenshot({ path: p });
  shots.push({ t, at, buf: readFileSync(p) });
  console.log('t=' + t + ' action.time=' + at.t + ' upperarmQ=[' + at.q + ']');
}
// pixel diff vs t=0 (PNG bytes differ trivially; compare decoded? use raw byte diff ratio as proxy + report sizes)
const b0 = shots[0].buf;
for (const s of shots.slice(1)) {
  let diff = 0;
  const n = Math.min(b0.length, s.buf.length);
  for (let i = 0; i < n; i += 997) if (b0[i] !== s.buf[i]) diff++;
  console.log('t=' + s.t + ' sampled-diff-ratio=' + (diff / (n / 997)).toFixed(3));
}
await browser.close();
console.log('PHASE TEST COMPLETE');
