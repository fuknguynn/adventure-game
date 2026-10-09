// walk-test.mjs — scripted waypoint-walk harness with stuck/collision detection.
//
// Boots the live app (save injection + "Continue Adventure"), then for each
// waypoint: teleports via the LIVE Player module (mutate SPAWNS.village_entrance
// + uiStore phase flip, same HMR-safe ?t= URL resolution as polish-shots.mjs),
// settles, and drives `joyMove` (converted through camOrbit.yaw to camera
// basis) straight toward the target for up to --timeout seconds. Optionally
// sprints a leg (touchFlags.sprint) and flags diagonal legs. Optional camera
// orbit sweep (camOrbit.yaw 0..2pi in 8 steps, screenshot each) near a point
// for camera-trap review.
//
// Usage:
//   node scripts/walk-test.mjs [options]
//     --out <path>        JSON report path            (default scripts/walk-current.json)
//     --route <file.json> route file                  (default: built-in village route)
//     --base <url>        dev server URL              (default http://localhost:5174/)
//     --timeout <sec>     per-leg drive cap           (default 8)
//     --orbit <x,z>       camera orbit sweep point
//     --shots <dir>       screenshot dir              (default shots/walk)
//
// Route file shape: { "waypoints": [{ "x":0,"z":6,"label":"spawn","sprint":false,
//   "diag":false }], "orbit": { "x":-32,"z":-19 }, "probes": [{ "label":
//   "inside-market","x":11.5,"z":-6,"escape":[7.5,-6] }] } — walk legs use
//   consecutive waypoints; a leg is reported dir=diagonal when |dx| and |dz|
//   are both >0.1 (or when either endpoint carries diag:true). Probes
//   teleport INSIDE a prop collider and try to escape: 0u displacement =
//   solid (expected, correct physics), any movement out = collider leak.
//
// Per-leg metrics: reached (end dist < 0.6u), traveled (path length), elapsed,
// stuckY (not reached and < 0.4u progress toward target in first 3s), wall
// (moved < 0.1u total — invisible wall; route legs also report @block[x,z]
// where motion died), fell (y < -3). Exit 0 when every route leg reached and
// every probe stayed solid, 1 on any stuck/wall/fell/leak (CI usable). No
// src/ edits; shared mutables only (input.joyMove/touchFlags/camOrbit,
// Player SPAWNS/playerPos, uiStore phase).
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// ---------------------------------------------------------------- CLI
const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : dflt;
};
const OUT = flag('--out', 'scripts/walk-current.json');
const BASE = flag('--base', 'http://localhost:5174/');
const SHOTS = flag('--shots', 'shots/walk');
const LEG_TIMEOUT = parseFloat(flag('--timeout', '8'));
const routeFile = flag('--route', null);
let route = routeFile
  ? JSON.parse(readFileSync(routeFile, 'utf8'))
  : { waypoints: [
      // Approach points chosen OUTSIDE prop footprints (villageLayout PROPS):
      // market stall (11.5,-6 rot, half 3.6x2.84) -> front approach (7.5,-6);
      // residential yard center/tent (-14,-7) -> courtyard (-13,-5);
      // watchtower (-32,-19 scale 9) -> approach (-28,-16).
      { x: 0, z: 6, label: 'spawn' },
      { x: 0, z: 13, label: 'gate' },
      { x: 0, z: -1, label: 'plaza' },
      { x: 7.5, z: -6, label: 'market-front', diag: true },
      { x: -13, z: -5, label: 'residential', diag: true },
      { x: -28, z: -16, label: 'tower-approach', diag: true },
      { x: 2, z: 2, label: 'spirit', diag: true, sprint: true },
    ], probes: [
      // Deliberate inside-prop spawn probes: teleport INSIDE the collider,
      // drive out. Expected: walled (0u) => solid collider, correct physics.
      // If the player walks out, the collider leaks => real anomaly.
      { label: 'inside-market', x: 11.5, z: -6, escape: [7.5, -6] },
      { label: 'inside-tent', x: -14, z: -7, escape: [-13, -5] },
      { label: 'inside-tower', x: -32, z: -19, escape: [-28, -16] },
    ] };
const orbitArg = flag('--orbit', null);
const orbit = orbitArg
  ? { x: parseFloat(orbitArg.split(',')[0]), z: parseFloat(orbitArg.split(',')[1]) }
  : route.orbit || null;

const SAVE = {
  schemaVersion: 1,
  profile: { displayName: 'Ray', characterId: 'knight' },
  progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false },
  settings: { quality: 'low', musicVolume: 0, sfxVolume: 0, reducedMotion: false, muted: true },
  updatedAt: new Date().toISOString(),
};

const REACHED_R = 0.6;      // "reached" radius (u)
const STUCK_WINDOW = 3.0;   // s — progress evaluated over this window
const STUCK_PROGRESS = 0.4; // u — less progress than this in the window => stuckY
const WALL_DISP = 0.1;      // u — total displacement below this => invisible wall
const FELL_Y = -3;          // u — body fell out of the world

mkdirSync(SHOTS, { recursive: true });
mkdirSync(OUT.replace(/[\\/][^\\/]*$/, '') || '.', { recursive: true });

// In-page module resolver: newest served URL the app actually fetched, so the
// imports hit the LIVE (possibly HMR'd ?t=) module instances. (pattern from
// polish-shots.mjs)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- browser
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
});
const p = await browser.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
await p.setViewport({ width: 960, height: 600 });
await p.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
await p.evaluate((s) => { localStorage.clear(); localStorage.setItem('eldergrove.save.v1', s); localStorage.setItem('eldergrove.hintSeen', '1'); }, JSON.stringify(SAVE));
await p.reload({ waitUntil: 'networkidle0' });
await sleep(8000);
await p.click('text=Continue Adventure');
await sleep(20000); // world load at software-render fps
console.log(`booted ${BASE} (${new Date().toISOString()})`);

// ---------------------------------------------------------------- helpers
async function teleport(x, z) {
  await p.evaluate(async ([x, z]) => {
    const find = (frag) => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(frag)).pop();
    if (!find('/src/game/Player.tsx') || !find('/src/game/input.ts') || !find('/src/stores/uiStore.ts')) throw new Error('module url not found');
    const P = await import(find('/src/game/Player.tsx'));
    P.SPAWNS.village_entrance = [x, 1, z];
    const ui = await import(find('/src/stores/uiStore.ts'));
    ui.useUI.getState().setPhase('WELCOME');
  }, [x, z]);
  await sleep(500);
  await p.evaluate(async () => {
    const u = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('/src/stores/uiStore.ts')).pop();
    const ui = await import(u);
    ui.useUI.getState().setPhase('PLAYING');
  });
  await sleep(2000); // remount + GLB cache hit at software-render fps
  // Poll playerPos until stable (3 consecutive ~250ms samples moved <0.03u).
  const s = await p.evaluate(async (maxMs) => {
    const find = (frag) => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(frag)).pop();
    if (!find('/src/game/Player.tsx')) throw new Error('module url not found');
    const P = await import(find('/src/game/Player.tsx'));
    const t0 = performance.now();
    let last = null, stable = 0, cur = null;
    while (performance.now() - t0 < maxMs) {
      cur = { x: P.playerPos.x, y: P.playerPos.y, z: P.playerPos.z };
      await new Promise((r) => setTimeout(r, 250));
      const moved = last ? Math.hypot(cur.x - last.x, cur.y - last.y, cur.z - last.z) : Infinity;
      stable = moved < 0.03 ? stable + 1 : 0;
      last = cur;
      if (stable >= 3) break;
    }
    return cur;
  }, 15000);
  return s;
}

async function drive(tx, tz, timeoutS, sprint) {
  return p.evaluate(async ([tx, tz, timeoutS, sprint, TH]) => {
    const find = (frag) => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(frag)).pop();
    if (!find('/src/game/Player.tsx') || !find('/src/game/input.ts')) throw new Error('module url not found');
    const P = await import(find('/src/game/Player.tsx'));
    const I = await import(find('/src/game/input.ts'));
    const pp = P.playerPos;
    const start = { x: pp.x, y: pp.y, z: pp.z };
    const d0 = Math.hypot(tx - start.x, tz - start.z);
    const samples = [{ t: 0, ...start }];
    const t0 = performance.now();
    I.touchFlags.sprint = !!sprint;
    await new Promise((res) => {
      const tick = () => {
        const t = performance.now() - t0;
        const dx = tx - pp.x, dz = tz - pp.z;
        const dist = Math.hypot(dx, dz);
        samples.push({ t, x: pp.x, y: pp.y, z: pp.z });
        if (dist < TH.REACHED || t > timeoutS * 1000 || pp.y < TH.FELL) { res(); return; }
        // world unit dir -> camera basis (Player: wx=ix*cy+iz*sy, wz=iz*cy-ix*sy)
        const cy = Math.cos(I.camOrbit.yaw), sy = Math.sin(I.camOrbit.yaw);
        const ux = dx / (dist || 1), uz = dz / (dist || 1);
        I.joyMove.x = ux * cy - uz * sy;
        I.joyMove.z = ux * sy + uz * cy;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    I.joyMove.x = 0; I.joyMove.z = 0; I.touchFlags.sprint = false;
    let traveled = 0, maxDisp = 0, minY = start.y, dist3 = null;
    let prev = start;
    for (const s of samples) {
      traveled += Math.hypot(s.x - prev.x, s.z - prev.z);
      maxDisp = Math.max(maxDisp, Math.hypot(s.x - start.x, s.z - start.z));
      minY = Math.min(minY, s.y);
      if (dist3 === null && s.t >= TH.STUCK_WINDOW * 1000)
        dist3 = Math.hypot(s.x - tx, s.z - tz);
      prev = s;
    }
    // block: last sample still making >0.4u per rolling second (where motion died)
    let block = null;
    for (let i = 0; i < samples.length; i++) {
      let j = i;
      while (j + 1 < samples.length && samples[j + 1].t - samples[i].t <= 1000) j++;
      if (j > i && Math.hypot(samples[j].x - samples[i].x, samples[j].z - samples[i].z) > 0.4)
        block = samples[i];
    }
    const end = { x: pp.x, y: pp.y, z: pp.z };
    return {
      start, end, d0,
      endDist: Math.hypot(end.x - tx, end.z - tz),
      traveled, maxDisp, minY,
      elapsed: samples[samples.length - 1].t / 1000,
      progress3: dist3 === null ? null : d0 - dist3,
      frames: samples.length, block,
    };
  }, [tx, tz, timeoutS, !!sprint, { REACHED: REACHED_R, STUCK_WINDOW, FELL: FELL_Y }]);
}

async function shot(name) {
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}

// ---------------------------------------------------------------- route
const wps = route.waypoints;
const legs = [];
for (let i = 1; i < wps.length; i++) {
  const from = wps[i - 1], to = wps[i];
  const spawnedAt = await teleport(from.x, from.z);
  const m = await drive(to.x, to.z, LEG_TIMEOUT, to.sprint);
  const dx = to.x - from.x, dz = to.z - from.z;
  const diagonal = Math.abs(dx) > 0.1 && Math.abs(dz) > 0.1;
  const reached = m.endDist < REACHED_R;
  const stuckY = !reached && m.progress3 !== null && m.progress3 < STUCK_PROGRESS && m.d0 > REACHED_R;
  const wall = !reached && m.maxDisp < WALL_DISP;
  const fell = m.minY < FELL_Y;
  const leg = {
    kind: 'route',
    from: from.label, to: to.label,
    from_xy: [from.x, from.z], to_xy: [to.x, to.z],
    dir: diagonal || to.diag || from.diag ? 'diagonal' : 'straight',
    sprint: !!to.sprint,
    spawn_settled_y: +spawnedAt.y.toFixed(2),
    start_xy: [+m.start.x.toFixed(2), +m.start.z.toFixed(2)],
    end_xy: [+m.end.x.toFixed(2), +m.end.z.toFixed(2)],
    goal_dist_m: +m.d0.toFixed(2),
    reached, end_dist: +m.endDist.toFixed(2),
    traveled: +m.traveled.toFixed(2),
    max_disp: +m.maxDisp.toFixed(2),
    elapsed: +m.elapsed.toFixed(1),
    progress3: m.progress3 === null ? null : +m.progress3.toFixed(2),
    stuckY, wall, fell, min_y: +m.minY.toFixed(2),
    fps_est: +(m.frames / Math.max(m.elapsed, 0.1)).toFixed(1),
    block_xy: m.block ? [+m.block.x.toFixed(2), +m.block.z.toFixed(2)] : null,
  };
  legs.push(leg);
  if (!reached) await shot(`stuck-${i}-${to.label}`);
  console.log(
    `LEG ${from.label}->${to.label} [${leg.dir}${leg.sprint ? ' sprint' : ''}] ` +
    `reached=${reached} end_dist=${leg.end_dist} traveled=${leg.traveled} ` +
    `elapsed=${leg.elapsed}s progress3=${leg.progress3}` +
    (stuckY ? ' STUCK' : '') + (wall ? ' WALL' : '') + (fell ? ' FELL' : '') +
    (leg.block_xy ? ` @${leg.block_xy}` : '')
  );
}

// ---- inside-prop probes: teleport inside the collider, try to walk out.
// Expected SOLID (0u displacement = correct physics); moving out => leak.
for (const pr of route.probes || []) {
  await teleport(pr.x, pr.z);
  const m = await drive(pr.escape[0], pr.escape[1], LEG_TIMEOUT, false);
  const probe = {
    kind: 'inside-prop', from: pr.label, to: 'escape',
    from_xy: [pr.x, pr.z], to_xy: pr.escape,
    spawn_settled_y: +m.start.y.toFixed(2),
    start_xy: [+m.start.x.toFixed(2), +m.start.z.toFixed(2)],
    end_xy: [+m.end.x.toFixed(2), +m.end.z.toFixed(2)],
    traveled: +m.traveled.toFixed(2),
    max_disp: +m.maxDisp.toFixed(2),
    elapsed: +m.elapsed.toFixed(1),
    leak: m.maxDisp >= WALL_DISP,
    min_y: +m.minY.toFixed(2),
  };
  probe.result = probe.leak ? 'LEAK' : 'solid';
  legs.push(probe);
  await shot(`probe-${pr.label}-${probe.result}`);
  console.log(`PROBE ${pr.label} @(${pr.x},${pr.z}) -> ${probe.result} (max_disp=${probe.max_disp} traveled=${probe.traveled} spawn_y=${probe.spawn_settled_y})`);
}

// ---------------------------------------------------------------- orbit sweep
let orbitShots = [];
if (orbit) {
  console.log(`orbit sweep near (${orbit.x},${orbit.z})`);
  await teleport(orbit.x, orbit.z);
  for (let i = 0; i < 8; i++) {
    await p.evaluate(async (yaw) => {
      const u = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('/src/game/input.ts')).pop();
      const I = await import(u);
      I.camOrbit.yaw = yaw;
    }, i * Math.PI / 4);
    await sleep(1800); // camera lerp settle at software-render fps
    const name = `orbit-${i}`;
    await shot(name);
    orbitShots.push(name + `.png`);
  }
}

// ---------------------------------------------------------------- report
const routeLegs = legs.filter((l) => l.kind === 'route');
const probes = legs.filter((l) => l.kind === 'inside-prop');
const anomalies = [
  ...routeLegs.filter((l) => !l.reached || l.stuckY || l.wall || l.fell)
    .map((l) => ({ leg: `${l.from}->${l.to}`, flags: [!l.reached && 'unreached', l.stuckY && 'stuckY', l.wall && 'wall', l.fell && 'fell'].filter(Boolean).join('|'), block_xy: l.block_xy })),
  ...probes.filter((l) => l.leak)
    .map((l) => ({ leg: `probe:${l.from}`, flags: 'collider-leak', block_xy: l.end_xy })),
];
const allReached = routeLegs.every((l) => l.reached && !l.fell) && probes.every((l) => !l.leak);
const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  legTimeoutS: LEG_TIMEOUT,
  thresholds: { reachedR: REACHED_R, stuckWindowS: STUCK_WINDOW, stuckProgressU: STUCK_PROGRESS, wallDispU: WALL_DISP, fellY: FELL_Y },
  legs, anomalies, allReached,
  orbit: orbit ? { point: [orbit.x, orbit.z], shots: orbitShots } : null,
  pageErrors: [...new Set(errs)],
};
writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`\n${routeLegs.length} route legs + ${probes.length} probes | ${anomalies.length} anomalies | exit ${allReached ? 0 : 1}`);
for (const a of anomalies) console.log(`  ANOMALY ${a.leg}: ${a.flags}${a.block_xy ? ` @block${a.block_xy}` : ''}`);
console.log(`report -> ${OUT}`);
if (errs.length) console.log('PAGE ERRORS:\n' + report.pageErrors.join('\n'));
await browser.close();
process.exit(allReached ? 0 : 1);
