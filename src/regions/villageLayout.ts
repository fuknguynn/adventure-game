/** Deterministic village layout: paths, clusters, instanced scatter, props.
 *  One source of truth for visuals AND colliders. Seeded RNG => stable. */

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(1337);
const rnd = (lo: number, hi: number) => lo + rng() * (hi - lo);

export interface Inst { pos: [number, number, number]; rotY: number; scale: number }
export interface InstC extends Inst { tint: number }

/** Path control points (Catmull-Rom chains). Gameplay anchors fixed. */
export const PATHS: number[][][] = [
  [[0, 15], [0, 10.5], [0, 6], [-0.5, 2], [0, -1]],            // entry S -> center
  [[0, -1], [2, -8], [9, -14], [18, -19], [28, -22]],           // NE grove
  [[0, -1], [-6, 2], [-15, 3], [-22, 4.5], [-28, 6]],           // W lake
  [[0, -1], [8, 1.5], [17, 3], [25, 4.5], [31, 5]],             // E ruins
  [[-6, 2], [-9, 0], [-11, -2.5]],                         // lake path -> residential yard spur
  [[0, 6], [0.5, 13], [-0.5, 21], [0, 26], [0, 31]],            // S tree
];

function samplePath(cp: number[][], step: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < cp.length - 1; i++) {
    const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)];
    const seg = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let s = 0; s < seg; s++) {
      const t = s / seg, t2 = t * t, t3 = t2 * t;
      pts.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  pts.push([cp[cp.length - 1][0], cp[cp.length - 1][1]]);
  return pts;
}

export const PATH_SAMPLES = PATHS.map((p) => samplePath(p, 1.1));

function distToPaths(x: number, z: number): number {
  let d = 1e9;
  for (const sp of PATH_SAMPLES) for (const [px, pz] of sp) {
    const dx = x - px, dz = z - pz; const dd = dx * dx + dz * dz;
    if (dd < d) d = dd;
  }
  return Math.sqrt(d);
}

// Gameplay POIs (immutable) that must stay clear of props/vegetation.
const POIS: [number, number, number][] = [
  [0, 6, 2.5],      // spawn
  [2, 2, 3],        // spirit
  [-3, 0, 2.2],     // npc
  [28, -22, 4], [-28, 6, 6], [31, 5, 4], [0, 31, 5], // puzzle spots + tree
];

export function keepClear(x: number, z: number, pathMin: number, propMin = 1.6): boolean {
  if (distToPaths(x, z) < pathMin) return false;
  for (const [px, pz, r] of POIS) {
    if (Math.hypot(x - px, z - pz) < r + propMin) return false;
  }
  return true;
}

function disk(cx: number, cz: number, rMin: number, rMax: number): [number, number] | null {
  const a = rng() * Math.PI * 2, r = rnd(rMin, rMax);
  const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
  return [x, z];
}

/** Dirt path discs + edge pebbles sampled along every path. */
export const PATH_DISCS: InstC[] = [];
export const PEBBLES: Inst[] = [];
for (const sp of PATH_SAMPLES) {
  for (let i = 0; i < sp.length; i++) {
    const [x, z] = sp[i];
    const w = rnd(0.95, 1.35);
    PATH_DISCS.push({ pos: [x + rnd(-0.12, 0.12), rnd(0.014, 0.024), z + rnd(-0.12, 0.12)], rotY: rnd(0, Math.PI), scale: w * 0.75, tint: rnd(0.85, 1.12) });
    if (i % 2 === 0) {
      const prev = sp[Math.max(0, i - 1)], next = sp[Math.min(sp.length - 1, i + 1)];
      const tx = next[0] - prev[0], tz = next[1] - prev[1];
      const tl = Math.hypot(tx, tz) || 1; const nx = -tz / tl, nz = tx / tl;
      for (const side of [-1, 1]) {
        if (rng() < 0.45) continue;
        const off = w + rnd(0.15, 0.5);
        PEBBLES.push({ pos: [x + nx * off * side + rnd(-0.2, 0.2), 0.02, z + nz * off * side + rnd(-0.2, 0.2)], rotY: rnd(0, Math.PI), scale: rnd(0.08, 0.16) });
      }
    }
  }
}

/** Ground tone patches (moss/dirt variation on the base disc). */
export const PATCHES: InstC[] = [];
for (let i = 0; i < 90; i++) {
  const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 34;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (distToPaths(x, z) < 1.4) continue;
  PATCHES.push({ pos: [x, 0.008 + rng() * 0.004, z], rotY: rnd(0, Math.PI), scale: rnd(1.6, 4.2), tint: i % 3 === 0 ? 0.8 : 1.15 });
}

export interface Tree extends Inst { kind: 0 | 1 | 2 | 3 | 4 | 5; collider: boolean; shadow: boolean }
export const TREES: Tree[] = [];
export const TREE_FILES = ['/models/env/Tree_1_A_Color1.gltf', '/models/env/Tree_1_B_Color1.gltf', '/models/env/Tree_1_C_Color1.gltf', '/models/env/Tree_2_A_Color1.gltf', '/models/env/Tree_3_A_Color1.gltf', '/models/env/Tree_5_B_Color1.gltf'];
const treeNorm = [3.9, 4.6, 7.4, 4.67, 3.51, 5.87]; // authored heights at scale 1

function addTree(x: number, z: number, s?: number, shadow = true) {
  const kind = Math.floor(rng() * 6) as Tree['kind'];
  const scale = (s ?? rnd(0.9, 1.5)) * 2.3 / treeNorm[kind]; // normalize to ~2.3 unit height at scale 1
  TREES.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale, kind, collider: Math.hypot(x, z) < 32, shadow });
}

// Framing clusters near entrance + clearing rim
for (const [x, z] of [[-5, 11], [-6.5, 8], [5.5, 10], [4.5, 13], [-5.5, 3.5], [6, 4.5], [-8, -2], [7.5, -2.5]] as const) addTree(x + rnd(-0.5, 0.5), z + rnd(-0.5, 0.5));
// POI-adjacent clusters (grove/lake/ruins/tree path heads)
for (const [cx, cz, n] of [[12, -13, 5], [-19, 1, 5], [25, 0, 4], [-5, 24, 4], [5, 26, 4], [16, -12, 3], [-11, 4, 3]] as const) {
  for (let i = 0; i < n; i++) {
    const p = disk(cx, cz, 1.5, 5);
    if (!p || !keepClear(p[0], p[1], 2.6, 2.2)) continue;
    addTree(p[0], p[1]);
  }
}
// Forest wall: dense ring, gap where each path exits; two rows for depth.
// Only the long exits punch a gap in the forest wall; short yard spurs don't.
const exitAngles = PATHS.filter((p) => Math.hypot(p[p.length - 1][0], p[p.length - 1][1]) > 25).map((p) => Math.atan2(p[p.length - 1][1], p[p.length - 1][0]));
for (let i = 0; i < 84; i++) {
  const a = (i / 84) * Math.PI * 2 + rnd(-0.02, 0.02);
  if (exitAngles.some((ea) => Math.abs(((a - ea + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.14)) continue;
  addTree(Math.cos(a) * rnd(36, 43), Math.sin(a) * rnd(36, 43), rnd(1.2, 1.8), false);
  if (i % 2 === 0) addTree(Math.cos(a + 0.03) * rnd(44, 52), Math.sin(a + 0.03) * rnd(44, 52), rnd(1.4, 2.1), false);
}

/** Leafless trees for the dead zones (ruins ridge, lake shore). */
export const BARE_TREES: Inst[] = [];
for (const [cx, cz, n, r] of [[32.5, 2.5, 6, 7], [29, 8, 4, 6], [-22, -3, 3, 6]] as const) {
  for (let i = 0; i < n; i++) {
    const p = disk(cx, cz, 2, r);
    if (!p || !keepClear(p[0], p[1], 2.6, 2)) continue;
    BARE_TREES.push({ pos: [p[0], 0, p[1]], rotY: rnd(0, Math.PI * 2), scale: rnd(1.0, 1.5) });
  }
}

export const BUSHES: Inst[] = [];
export const GRASS: Inst[] = [];
export const ROCKS: InstC[] = [];
// Negative space: open plazas around the center square, the residential yard
// and the gate corridor keep the layout from reading as scattered filler.
const OPEN: [number, number, number][] = [[0, -1, 5.5], [-13, -7, 4.5], [0, 12.5, 5], [2, 2, 5]];
for (let i = 0; i < 110; i++) {
  const a = rng() * Math.PI * 2, r = 4 + Math.sqrt(rng()) * 30;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (!keepClear(x, z, 1.5, 0.4)) continue;
  if (OPEN.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr)) continue;
  const roll = rng();
  if (roll < 0.3) BUSHES.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: rnd(2.2, 4.5) });
  else if (roll < 0.84) GRASS.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: rnd(0.8, 1.6) });
  else ROCKS.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: rnd(0.6, 1.7), tint: rnd(0.45, 0.7) });
}

export const FIREFLIES: [number, number, number][] = [];
for (let i = 0; i < 70; i++) {
  const aroundSpirit = i < 34;
  const cx = aroundSpirit ? 2 : PATH_SAMPLES[0][Math.floor(rng() * PATH_SAMPLES[0].length)][0];
  const cz = aroundSpirit ? 2 : PATH_SAMPLES[0][Math.floor(rng() * PATH_SAMPLES[0].length)][1];
  const p = disk(cx, cz, 0.5, aroundSpirit ? 6.5 : 3.5);
  if (p) FIREFLIES.push([p[0], rnd(0.8, 2.6), p[1]]);
}

export interface Prop { file: string; pos: [number, number, number]; rotY: number; scale: number; light?: boolean }
export const PROPS: Prop[] = [
  // Zone C — hero village gate: tall wall, open 2-tile road (piers carved in EnvColliders)
  { file: '/models/env/wall_gated.gltf', pos: [0, 0, 15.5], rotY: 0, scale: 3 },
  { file: '/models/props/post_lantern.gltf', pos: [-3.9, 0, 13.6], rotY: 0, scale: 1, light: true },
  { file: '/models/props/post_lantern.gltf', pos: [3.9, 0, 13.6], rotY: 0, scale: 1, light: true },
  // Junction lantern guiding into the square
  { file: '/models/props/lantern.gltf', pos: [-2.2, 0, -2.5], rotY: 1.2, scale: 0.72, light: true },
  // Spirit clearing: ring of stones + shrine facing the spirit
  ...stoneRing(2, 2, 6.8, 9),
  { file: '/models/env/shrine_green.gltf', pos: [6.5, 0, -2.5], rotY: Math.atan2(2 - -2.5, 2 - 6.5) + Math.PI / 2, scale: 1.6 },
  // Small storage group by the well (one clustered set, not scattered clutter)
  { file: '/models/props/barrel.gltf', pos: [6.1, 0, -5.4], rotY: 0.4, scale: 1.15 },
  { file: '/models/props/barrel.gltf', pos: [5.4, 0, -6.2], rotY: 1.1, scale: 1.15 },
  { file: '/models/props/chest.gltf', pos: [6.8, 0, -6.0], rotY: -0.7, scale: 1.1 },
  // Lake shore dressing: cascade banner + rocks around the water
  { file: '/models/env/banner_blue.gltf', pos: [-24.5, 0, 9.5], rotY: -1.1, scale: 1.2 },
  { file: '/models/props/stone.gltf', pos: [-23.5, 0, 3], rotY: 0.6, scale: 1.1 },
  { file: '/models/props/stone.gltf', pos: [-25.5, 0, 11.5], rotY: 2.4, scale: 0.85 },
  { file: '/models/props/stone.gltf', pos: [-32, 0, 10.5], rotY: 1.3, scale: 1.3 },
  { file: '/models/props/stone.gltf', pos: [-33, 0, 1.5], rotY: 0.2, scale: 1.0 },
  // Ruins + grove path markers
  { file: '/models/props/stone.gltf', pos: [21, 0, 0.5], rotY: 1.7, scale: 0.8 },
  { file: '/models/props/stone.gltf', pos: [14, 0, -16.5], rotY: 0.4, scale: 0.7 },
];

// ---- Village composition v2: measured scales + four readable zones ----
// Player renders ~2.5u tall, so houses target 3.0-3.5x player roof peaks
// (~7.6-8.9u) and the gate reads as a hero entrance. Zones:
// A center plaza (~0,-1: well, benches, market stall, goods, hero tree)
// B residential yard NW (4 structures sharing a yard, doors facing inward)
// C hero gate (top of PROPS)  D distant watchtower, SW background
const faceTo = (px: number, pz: number, tx: number, tz: number) => Math.atan2(tx - px, tz - pz);
const YARD: [number, number] = [-13, -7];
PROPS.push(
  // Zone A hero: big village tree anchoring the plaza (trunk collider via BUILDING_HALF)
  { file: '/models/env/Tree_1_C_Color1.gltf', pos: [-8, 0, -5.5], rotY: 0.7, scale: 1.7 },
  // Well + seating + market stall with one goods cluster anchor the square
  { file: '/models/village/well.gltf', pos: [4.6, 0, -4.4], rotY: -0.5, scale: 4 },
  ...stoneRing(4.6, -4.4, 2.6, 6),
  { file: '/models/village/market.gltf', pos: [9.5, 0, -4.5], rotY: faceTo(9.5, -4.5, 0, -1), scale: 4 },
  { file: '/models/props/crate_open.gltf', pos: [7.9, 0, -6.6], rotY: 0.5, scale: 3 },
  { file: '/models/props/sack.gltf', pos: [8.7, 0, -7.2], rotY: 2.9, scale: 4 },
  { file: '/models/props/bench.gltf', pos: [3.1, 0, -2.2], rotY: faceTo(3.1, -2.2, 4.6, -4.4), scale: 2 },
  { file: '/models/props/bench.gltf', pos: [2.4, 0, -7], rotY: faceTo(2.4, -7, 4.6, -4.4), scale: 2 },
  { file: '/models/props/bench.gltf', pos: [-3.4, 0, 10.2], rotY: -1.2, scale: 1.6 },
  // Wayfinding at the junction
  { file: '/models/props/sign_right.gltf', pos: [2.6, 0, -3.6], rotY: faceTo(2.6, -3.6, 9, -14), scale: 1 },
  { file: '/models/props/sign_left.gltf', pos: [-2.9, 0, -2.6], rotY: faceTo(-2.9, -2.6, -15, 3), scale: 1 },
  { file: '/models/props/sign_right.gltf', pos: [-1.8, 0, 9.6], rotY: faceTo(-1.8, 9.6, 0, 31), scale: 1 },
  // Plaza lamp posts (drive LAMP_LIGHTS)
  { file: '/models/props/post_lantern.gltf', pos: [-2.6, 0, -6.2], rotY: -0.6, scale: 1, light: true },
  { file: '/models/props/post_lantern.gltf', pos: [6.9, 0, -1.2], rotY: 2.6, scale: 1, light: true },
  // Zone B residential yard: houses share orientation, doors face the yard
  { file: '/models/village/home_a.gltf', pos: [-18.5, 0, -5.5], rotY: faceTo(-18.5, -5.5, ...YARD), scale: 8 },
  { file: '/models/village/home_b.gltf', pos: [-16.5, 0, -12.5], rotY: faceTo(-16.5, -12.5, ...YARD), scale: 6.2 },
  { file: '/models/village/home_a.gltf', pos: [-10, 0, -9.5], rotY: faceTo(-10, -9.5, ...YARD), scale: 7 },
  // Craft longhouse + forge at the yard's south edge
  { file: '/models/village/barracks.gltf', pos: [-20, 0, -12], rotY: faceTo(-20, -12, ...YARD), scale: 4.5 },
  { file: '/models/village/tent.gltf', pos: [-13.5, 0, -9.5], rotY: 2.4, scale: 5 },
  { file: '/models/props/anvil.gltf', pos: [-16, 0, -8.3], rotY: -0.8, scale: 0.9 },
  { file: '/models/props/torch_lit.gltf', pos: [-16.9, 0.45, -7.6], rotY: 0, scale: 1.2, light: true },
  { file: '/models/props/torch_lit.gltf', pos: [-15.2, 0.45, -8.9], rotY: 0, scale: 1.2, light: true },
  { file: '/models/props/post_lantern.gltf', pos: [-13.5, 0, -4.8], rotY: 0, scale: 1, light: true },
  // Zone D distant background landmark, off the walking paths
  { file: '/models/village/watchtower.gltf', pos: [-27, 0, -14], rotY: faceTo(-27, -14, 0, 0), scale: 9 },
);

// ---- Landmark dressing (feat/environment-polish) ----
// Ruins at (31,5): broken dungeon walls + columns + a small graveyard behind.
PROPS.push(
  { file: '/models/env/wall_broken.gltf', pos: [27, 0, -1.5], rotY: 0.4, scale: 1 },
  { file: '/models/env/wall_broken.gltf', pos: [35.5, 0, 1.5], rotY: 2.2, scale: 1 },
  { file: '/models/env/wall_archedwindow_open.gltf', pos: [31, 0, 11], rotY: 0, scale: 1 },
  { file: '/models/env/column.gltf', pos: [29, 0, 2], rotY: 0.3, scale: 2 },
  { file: '/models/env/column.gltf', pos: [34, 0, 7.5], rotY: 1.1, scale: 2 },
  { file: '/models/env/rubble_large.gltf', pos: [36.5, 0, 8.5], rotY: 0.7, scale: 0.7 },
  { file: '/models/props/gravestone.gltf', pos: [28, 0, 1.4], rotY: 0.15, scale: 0.8 },
  { file: '/models/props/gravestone.gltf', pos: [29.6, 0, 0.8], rotY: -0.1, scale: 0.8 },
  { file: '/models/props/gravestone.gltf', pos: [31.2, 0, 1.2], rotY: 0.25, scale: 0.8 },
  { file: '/models/props/grave_a.gltf', pos: [33.2, 0, 0.6], rotY: -0.2, scale: 0.8 },
  { file: '/models/props/post_skull.gltf', pos: [34.6, 0, 11.2], rotY: 0.5, scale: 1 },
  // Ancient Tree clearing: stone ring, flanking columns, rubble halo
  ...stoneRing(0, 31, 7.5, 12),
  { file: '/models/env/column.gltf', pos: [-2.6, 0, 27], rotY: 0, scale: 2 },
  { file: '/models/env/column.gltf', pos: [2.6, 0, 27], rotY: 0, scale: 2 },
  { file: '/models/env/rubble_large.gltf', pos: [-5.5, 0, 33.5], rotY: 2.1, scale: 0.6 },
  { file: '/models/env/rubble_large.gltf', pos: [5.8, 0, 34], rotY: 0.9, scale: 0.6 },
  // Lake shore gem cluster (echoes the underwater reward)
  { file: '/models/props/Gem_Large.gltf', pos: [-24.2, 0, 10.6], rotY: 0.4, scale: 2.4 },
  { file: '/models/props/Gem_Large.gltf', pos: [-23.4, 0, 11.4], rotY: -0.7, scale: 1.8 },
  { file: '/models/props/Gem_Large.gltf', pos: [-24.9, 0, 11.6], rotY: 1.9, scale: 1.4 },
  { file: '/models/props/Gem_Medium.gltf', pos: [-23.9, 0, 12.2], rotY: 0.2, scale: 1.6 },
);


/** Solid-prop half-extents at scale 1 (measured world AABBs), keyed by file.
 *  Drives cuboid colliders + the footprint sweep below. */
export const BUILDING_HALF: Record<string, [number, number, number]> = {
  '/models/village/home_a.gltf': [0.44, 0.93, 0.47],
  '/models/village/home_b.gltf': [0.44, 1.28, 0.56],
  '/models/village/market.gltf': [0.9, 0.98, 0.71],
  '/models/village/barracks.gltf': [0.72, 1.64, 0.85],
  '/models/village/well.gltf': [0.34, 0.83, 0.38],
  '/models/village/watchtower.gltf': [0.52, 1.11, 0.52],
  '/models/village/tent.gltf': [0.26, 0.52, 0.26],
  '/models/props/bench.gltf': [0.88, 0.5, 0.38],
  '/models/props/anvil.gltf': [0.9, 0.8, 0.38],
  '/models/props/sign_left.gltf': [0.96, 2, 0.2],
  '/models/props/sign_right.gltf': [0.96, 2, 0.2],
  '/models/props/post_lantern.gltf': [0.32, 3.3, 0.79],
  '/models/props/post_skull.gltf': [0.41, 3.3, 0.79],
  '/models/props/gravestone.gltf': [0.7, 1.6, 0.2],
  '/models/props/grave_a.gltf': [1, 2.13, 0.5],
  '/models/props/crate_open.gltf': [0.17, 0.2, 0.1],
  '/models/env/wall_gated.gltf': [2, 4, 0.5],
  '/models/env/pillar.gltf': [0.75, 4, 0.75],
  '/models/env/banner_blue.gltf': [0.75, 3.2, 0.16],
  '/models/env/wall_broken.gltf': [2, 4, 0.5],
  '/models/env/wall_archedwindow_open.gltf': [2, 4, 0.5],
  '/models/env/column.gltf': [0.35, 1.4, 0.35],
  '/models/env/Tree_1_C_Color1.gltf': [0.32, 7.4, 0.32], // village hero trunk
};

/** Low garden fences: fence_wood pieces are 1.15u long, runs auto-space by
 *  that length at the given scale. */
export const FENCES: Inst[] = [];
function fenceRun(x0: number, z0: number, x1: number, z1: number, scale = 2) {
  const rotY = Math.atan2(x1 - x0, z1 - z0);
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(2, Math.round(len / (1.15 * scale)) + 1);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    FENCES.push({ pos: [x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t], rotY, scale });
  }
}
// Residential yard: fence line north (gap for the path spur) + west edge.
fenceRun(-18.5, -2.5, -12.5, -2.5, 2.5);
fenceRun(-10.6, -3.1, -9, -4.5, 2.5);
fenceRun(-21.5, -3.2, -21.5, -8.5, 2.5);

// Structures are declared after scatter in module order; sweep any
// vegetation/fence piece that ended up inside a structure footprint. The gate
// and hero trunk are walk-through / narrow, so only their real body
// (half-width / trunk radius) prunes vegetation, not the full AABB.
for (const p of PROPS) {
  const m = BUILDING_HALF[p.file];
  if (!m) continue;
  const trunk = p.file.includes('wall_gated') || p.file.includes('Tree_1_C');
  const r = (trunk ? m[0] : m[0] + m[2]) * p.scale; // trunk radius vs rotated box
  const inside = (q: Inst) => Math.hypot(q.pos[0] - p.pos[0], q.pos[2] - p.pos[2]) < r + 1.2;
  for (const arr of [TREES, BUSHES, GRASS, ROCKS, BARE_TREES, FENCES] as Inst[][]) {
    for (let i = arr.length - 1; i >= 0; i--) if (inside(arr[i])) arr.splice(i, 1);
  }
}

/** Lake flora: lily pads on the water, reeds along the shore. */
export const LILIES: Inst[] = [];
for (let i = 0; i < 14; i++) {
  const p = disk(-29, 6, 0.5, 5.5);
  if (p) LILIES.push({ pos: [p[0], 0.03, p[1]], rotY: rnd(0, Math.PI * 2), scale: rnd(6, 10) });
}
export const WATERPLANTS: Inst[] = [];
for (let i = 0; i < 18; i++) {
  const a = rng() * Math.PI * 2, r = rnd(6.9, 8.4);
  const x = -29 + Math.cos(a) * r * 1.1, z = 6 + Math.sin(a) * r;
  if (distToPaths(x, z) < 2) continue;
  WATERPLANTS.push({ pos: [x, 0.02, z], rotY: rnd(0, Math.PI * 2), scale: rnd(6, 9) });
}

/** Glowing grove: mushroom caps ringed around the spirit_path POI (teal tint). */
export const MUSHROOMS: InstC[] = [];
for (const [cx, cz, n, r0, r1] of [[28, -22, 10, 5, 8], [25.5, -18.5, 4, 1.2, 2.5], [31, -25, 5, 2, 4]] as const) {
  for (let i = 0; i < n; i++) {
    const p = disk(cx, cz, r0, r1);
    if (!p || !keepClear(p[0], p[1], 1.2, 0.8)) continue;
    MUSHROOMS.push({ pos: [p[0], 0, p[1]], rotY: rnd(0, Math.PI * 2), scale: rnd(1.1, 2.1), tint: rnd(0.5, 0.8) });
  }
}

function stoneRing(cx: number, cz: number, r: number, n: number): Prop[] {
  const out: Prop[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2;
    out.push({ file: '/models/props/stone.gltf', pos: [cx + Math.cos(a) * (r + rnd(-0.4, 0.4)), 0, cz + Math.sin(a) * (r + rnd(-0.4, 0.4))], rotY: rnd(0, Math.PI), scale: rnd(0.55, 0.85) });
  }
  return out;
}

/** Lamp light positions; heights differ per model. */
export const LAMP_LIGHTS: [number, number, number][] = PROPS.filter((p) => p.light).map((p) => {
  const h = p.file.includes('post_lantern') ? 3.0 : p.file.includes('torch_lit') ? 1.1 : p.file.includes('lantern') ? 3.3 : 1;
  return [p.pos[0], p.pos[1] + h * p.scale, p.pos[2]];
});

