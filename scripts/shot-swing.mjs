// Targeted swing check: walk cycle phases t=0/0.5/0.75 for knight+rogue.
import puppeteer from 'puppeteer-core';
import { mkdirSync, unlinkSync } from 'node:fs';
mkdirSync('shots/upper', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=900,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const char of ['knight', 'rogue']) {
  for (const t of ['0', '0.5', '0.75']) {
    const name = char + '-Walking_A-t' + t + '.png';
    await page.goto('http://localhost:5177/anim-lab.html?char=' + char + '&clip=Walking_A&t=' + t + '&az=45&wide=2.1', { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForFunction('window.__ready === true', { timeout: 20000 });
    await sleep(300);
    const p = 'shots/upper/' + name;
    try { unlinkSync(p); } catch {}
    await page.screenshot({ path: p });
    console.log('shot ' + name);
  }
}
await browser.close();
console.log('SWING CHECK COMPLETE');
