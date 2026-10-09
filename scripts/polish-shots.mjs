// Screenshot runner for the polish pass. Same behavior as env-shots.mjs but
// resolves app modules by their ACTUAL served URL (performance entries), so
// imports still hit the live Vite module instances after HMR (?t=) reloads.
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';

const OUT = process.argv[2] || 'shots/env/polish';
mkdirSync(OUT, { recursive: true });

const SAVE = {
  schemaVersion: 1,
  profile: { displayName: 'Ray', characterId: 'knight' },
  progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false },
  settings: { quality: 'low', musicVolume: 0, sfxVolume: 0, reducedMotion: false, muted: true },
  updatedAt: new Date().toISOString(),
};

let POIS = JSON.parse(readFileSync(process.argv[3], 'utf8'));

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
});
const p = await browser.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
await p.setViewport({ width: 960, height: 600 });
await p.goto('http://localhost:5174/', { waitUntil: 'networkidle0', timeout: 60000 });
await p.evaluate((s) => { localStorage.clear(); localStorage.setItem('eldergrove.save.v1', s); localStorage.setItem('eldergrove.hintSeen', '1'); }, JSON.stringify(SAVE));
await p.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 8000));
await p.click('text=Continue Adventure');
await new Promise((r) => setTimeout(r, 20000)); // world load at software-render fps

const settle = async (ms) => { await new Promise((r) => setTimeout(r, ms)); };

async function shot(name) {
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
}

async function teleport([x, z], yaw) {
  // Resolve each module to the newest URL the app actually fetched (handles
  // Vite ?t= cache-busting); mutate THAT instance so the running app sees it.
  await p.evaluate(async ([x, z, yaw]) => {
    const find = (frag) => performance.getEntriesByType('resource')
      .map((e) => e.name).filter((n) => n.includes(frag)).pop();
    const playerUrl = find('/src/game/Player.tsx');
    const inputUrl = find('/src/game/input.ts');
    const uiUrl = find('/src/stores/uiStore.ts');
    if (!playerUrl || !inputUrl || !uiUrl) throw new Error('module url not found');
    const P = await import(playerUrl);
    P.SPAWNS.village_entrance = [x, 1, z];
    const inp = await import(inputUrl);
    inp.camOrbit.yaw = yaw;
    const ui = await import(uiUrl);
    ui.useUI.getState().setPhase('WELCOME');
  }, [x, z, yaw]);
  await settle(600);
  await p.evaluate(async () => {
    const uiUrl = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('/src/stores/uiStore.ts')).pop();
    const ui = await import(uiUrl);
    ui.useUI.getState().setPhase('PLAYING');
  });
  await settle(20000); // remount + GLB cache warm + camera lerp settle
}

for (const poi of POIS) {
  await teleport(poi.pos, poi.yaw);
  await shot(poi.name);
}

// mobile viewport from spawn
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await teleport([0, 6], 0);
await shot('mobile-spawn');

if (errs.length) console.log('PAGE ERRORS:\n' + [...new Set(errs)].join('\n'));
await browser.close();
