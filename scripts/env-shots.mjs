// Throwaway: capture environment screenshots from the gameplay camera at each POI.
// Teleports by flipping phase (GameCanvas remounts Player at mutated SPAWNS entry).
// Usage: node scripts/env-shots.mjs <outDir>
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] || 'shots/env/before';
mkdirSync(OUT, { recursive: true });

const SAVE = {
  schemaVersion: 1,
  profile: { displayName: 'Ray', characterId: 'knight' },
  progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false },
  settings: { quality: 'low', musicVolume: 0, sfxVolume: 0, reducedMotion: false, muted: true },
  updatedAt: new Date().toISOString(),
};

const POIS = [
  { name: 'spawn', pos: [0, 6], yaw: 0 },
  { name: 'village-center', pos: [1, -3], yaw: 2.4 },
  { name: 'spirit-clearing', pos: [2, 6], yaw: -0.3 },
  { name: 'junction', pos: [0, -1], yaw: -1.2 },
  { name: 'ruins', pos: [24, 4], yaw: 0.4 },
  { name: 'lake', pos: [-22, 5], yaw: -1.35 },
  { name: 'grove', pos: [22, -18], yaw: 2.3 },
  { name: 'ancient-tree', pos: [0, 26], yaw: 3.1 },
];

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
  await p.evaluate(async ([x, z, yaw]) => {
    const P = await import('/src/game/Player.tsx');
    P.SPAWNS.village_entrance = [x, 1, z];
    const inp = await import('/src/game/input.ts');
    inp.camOrbit.yaw = yaw;
    const ui = await import('/src/stores/uiStore.ts');
    ui.useUI.getState().setPhase('WELCOME');
  }, [x, z, yaw]);
  await settle(600);
  await p.evaluate(async () => {
    const ui = await import('/src/stores/uiStore.ts');
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
