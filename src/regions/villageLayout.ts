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
  [[0, 15], [0, 10.5], [0, 6], [-0.5, 2], [0, -1]],            // P1 entry S -> plaza
  [[0, -1], [4.5, -2.5], [8, -3.5], [11.5, -5]],                // P2 plaza -> market stall front
  [[12, -4.6], [9.5, -8.6], [3, -10], [-3, -9], [-8, -8], [-12, -6]], // P3 market -> residential courtyard
  [[-12, -6], [-16.5, -8.5], [-21.5, -8.4], [-23.5, -7], [-26, -3], [-28, 6]], // P4 residential -> lake exit
  [[0, -1], [3, -6], [8, -12], [18, -19], [28, -22]],          // P5 plaza -> grove
  [[0, -1], [6, 3], [10.5, 9], [16, 9.5], [20, 9], [25, 6], [31, 5]], // P6 plaza -> ruins
  [[0, 6], [0.5, 13], [-0.5, 21], [0, 26], [0, 31]],           // P7 plaza -> ancient tree
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

export function keepClear(x: number, z: number, pathMin: number, propMin = 2.2): boolean {
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
for (let i = 0; i < 70; i++) {
  const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 34;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (distToPaths(x, z) < 1.4) continue;
  if (Math.hypot(x - 0, z - 31) < 10) continue; // keep the ritual clearing floor clean
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

// Framing clusters near entrance + clearing rim; dropped when they land on a
// path corridor and capped small so canopies stay off the gameplay frame.
for (const [x, z] of [[-5, 11], [-6.5, 8], [5.5, 10], [4.5, 13], [-5.5, 3.5], [6, 4.5], [-8, -2], [7.5, -2.5]] as const) {
  const tx = x + rnd(-0.5, 0.5), tz = z + rnd(-0.5, 0.5);
  if (distToPaths(tx, tz) < 2.5) continue;
  addTree(tx, tz, rnd(0.8, 1.15));
}
// POI-adjacent clusters (grove/lake/ruins + tree clearing flanks, pulled wide
// of the clearing so the Ancient Tree approach stays open)
for (const [cx, cz, n] of [[12, -13, 5], [-19, 1, 5], [25, 0, 4], [-11, 29, 3], [11, 30, 3], [16, -12, 3], [-11, 4, 3]] as const) {
  for (let i = 0; i < n; i++) {
    const p = disk(cx, cz, 1.5, 5);
    if (!p || !keepClear(p[0], p[1], 3, 2.5)) continue;
    if (Math.hypot(p[0], p[1] - 31) < 10.5) continue; // Ancient Tree clearing stays open
    addTree(p[0], p[1], rnd(0.8, 1.15));
  }
}
// Forest wall: dense ring, gap where each path exits; two rows for depth.
// Only the long exits punch a gap in the forest wall; short yard spurs don't.
const exitAngles = PATHS.filter((p) => Math.hypot(p[p.length - 1][0], p[p.length - 1][1]) > 25).map((p) => Math.atan2(p[p.length - 1][1], p[p.length - 1][0]));
for (let i = 0; i < 84; i++) {
  const a = (i / 84) * Math.PI * 2 + rnd(-0.02, 0.02);
  if (exitAngles.some((ea) => Math.abs(((a - ea + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.14)) continue;
  addTree(Math.cos(a) * rnd(36, 43), Math.sin(a) * rnd(36, 43), rnd(0.8, 1.2), false);
  if (i % 2 === 0) addTree(Math.cos(a + 0.03) * rnd(44, 52), Math.sin(a + 0.03) * rnd(44, 52), rnd(0.8, 1.2), false);
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
// Crystal Lake east-reveal: a handful of bare silhouettes hugging the north
// rim (walk-over, no colliders) so the approach reads open water + skeletal
// shapes instead of a forest wall.
for (const [x, z, s] of [[-31.8, -1.5, 1.6], [-33.8, 0.5, 1.2], [-28.8, -1, 1.35]] as const) {
  BARE_TREES.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: s });
}

export const BUSHES: Inst[] = [];
export const GRASS: Inst[] = [];
export const ROCKS: InstC[] = [];
// Negative space: open plazas around the center square, the residential yard,
// the gate corridor, the spirit ring interior and the Ancient Tree clearing
// keep the layout from reading as scattered filler. The lake ring keeps the
// shoreline itself — curated stones + gems — as the only composition there.
const OPEN: [number, number, number][] = [[0, -1, 8.5], [-12, -6.5, 5.5], [0, 12.5, 5], [2, 2, 6], [0, 31, 9.5], [-31, -28, 8], [-15, -10.5, 3.5], [15, -2.5, 7], [-29, 6, 10]];
for (let i = 0; i < 55; i++) {
  const a = rng() * Math.PI * 2, r = 4 + Math.sqrt(rng()) * 30;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (!keepClear(x, z, 2.2, 0.4)) continue;
  if (OPEN.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr)) continue;
  const roll = rng();
  if (roll < 0.3) BUSHES.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: rnd(2.2, 4.5) });
  else if (roll < 0.84) GRASS.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: rnd(0.8, 1.6) });
  else ROCKS.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: rnd(0.6, 1.7), tint: rnd(0.45, 0.7) });
}

export const FIREFLIES: [number, number, number][] = [];
for (let i = 0; i < 60; i++) {
  const aroundSpirit = i < 32;
  const cx = aroundSpirit ? 2 : PATH_SAMPLES[0][Math.floor(rng() * PATH_SAMPLES[0].length)][0];
  const cz = aroundSpirit ? 2 : PATH_SAMPLES[0][Math.floor(rng() * PATH_SAMPLES[0].length)][1];
  const p = disk(cx, cz, 0.5, aroundSpirit ? 6.5 : 3.5);
  if (p) FIREFLIES.push([p[0], rnd(0.8, 2.6), p[1]]);
}

export interface Prop { file: string; pos: [number, number, number]; rotY: number; scale: number; light?: boolean }
export const PROPS: Prop[] = [
  // Zone C — hero village gate: tall wall, open 2-tile road (piers carved in EnvColliders)
  { file: '/models/env/wall_gated.gltf', pos: [0, 0, 15.5], rotY: 0, scale: 2.25 },
  { file: '/models/props/post_lantern.gltf', pos: [-5.6, 0, 13.6], rotY: 0, scale: 1, light: true },
  { file: '/models/props/post_lantern.gltf', pos: [5.6, 0, 13.6], rotY: 0, scale: 1, light: true },
  // Junction marker guiding into the square (lit by the adjacent plaza lamps)
  { file: '/models/props/lantern.gltf', pos: [-2.2, 0, -2.5], rotY: 1.2, scale: 0.72 },
  // Spirit clearing: entry-gap ring facing the plaza (south opening), one
  // asymmetric framing tree on the NW rim, shrine on the north edge facing
  // the approach. The plaza bench at 2.8,3.8 is the single low accent; the
  // rest of the ring interior stays empty negative space.
  ...stoneArc(2, 2, 6.5, -Math.PI / 2 + 0.6, Math.PI * 1.5 - 0.6, 8, 0.7),
  { file: '/models/env/Tree_1_A_Color1.gltf', pos: [-4.5, 0, 7.5], rotY: 0.6, scale: 1.4 },
  { file: '/models/env/shrine_green.gltf', pos: [2, 0, 8], rotY: Math.PI, scale: 1.7 },
  // Lake shore: curated rim arc — four varied stones sweeping west to north so
  // the east approach stays open and reads as one deliberate shoreline line.
  { file: '/models/props/stone.gltf', pos: [-36.5, 0, 4], rotY: 0.6, scale: 1.3 },
  { file: '/models/props/stone.gltf', pos: [-36.8, 0, 8.2], rotY: 2.2, scale: 1 },
  { file: '/models/props/stone.gltf', pos: [-34, 0, 11.8], rotY: 1.3, scale: 1.5 },
  { file: '/models/props/stone.gltf', pos: [-31.2, 0, 13.6], rotY: -0.4, scale: 1.1 },
  // Ruins + grove path markers
  { file: '/models/props/stone.gltf', pos: [21, 0, 0.5], rotY: 1.7, scale: 0.8 },
  { file: '/models/props/stone.gltf', pos: [14, 0, -16.5], rotY: 0.4, scale: 0.7 },
];
// ---- Village composition v3 (locked rebuild design) ----
// Player 2.54u. Roof peaks 3.0-3.9x, stall roof above head, >=5u between
// major building collider edges. Zones: A gate corridor (clean), B plaza
// (0,-1), C market strip N of P2, D residential courtyard (-12,-6.5),
// E distant watchtower landmark.
const faceTo = (px: number, pz: number, tx: number, tz: number) => Math.atan2(tx - px, tz - pz);
const COURT: [number, number] = [-12, -6.5];
PROPS.push(
  // Zone B plaza hero tree (trunk collider via Tree_1_C BUILDING_HALF entry)
  { file: '/models/env/Tree_1_C_Color1.gltf', pos: [-4.5, 0, -5.5], rotY: 0.7, scale: 1.15 },
  // Well + two benches face each other across the square
  { file: '/models/village/well.gltf', pos: [-5.5, 0, 5.5], rotY: -0.5, scale: 4 },
  ...stoneRing(-5.5, 5.5, 2.4, 4),
  { file: '/models/props/bench.gltf', pos: [2.2, 0, -5.8], rotY: faceTo(2.2, -5.8, 0, -1), scale: 2.4 },
  { file: '/models/props/bench.gltf', pos: [2.8, 0, 3.8], rotY: faceTo(2.8, 3.8, 0, -1), scale: 2.4 },
  // Wayfinding: junction pair + a market sign pointing at the stall
  { file: '/models/props/sign_right.gltf', pos: [2.6, 0, -3.6], rotY: faceTo(2.6, -3.6, 9, -14), scale: 1 },
  { file: '/models/props/sign_left.gltf', pos: [-4.6, 0, -1.6], rotY: faceTo(-4.6, -1.6, -15, 3), scale: 1 },
  { file: '/models/props/sign_right.gltf', pos: [-3.6, 0, 9.6], rotY: faceTo(-3.6, 9.6, 0, 31), scale: 1 },
  { file: '/models/props/sign_right.gltf', pos: [6.5, 0, -3.2], rotY: faceTo(6.5, -3.2, 14, -3), scale: 1 },
  // Plaza lamps (drive LAMP_LIGHTS): one plaza edge + one market-side
  { file: '/models/props/post_lantern.gltf', pos: [-6, 0, -3], rotY: -0.6, scale: 1, light: true },
  { file: '/models/props/post_lantern.gltf', pos: [-2.5, 0, 8.5], rotY: 0.8, scale: 1, light: true },
  // Zone C market: ONE hero stall facing the plaza + ONE tent vendor at the
  // far end of a deliberately empty trading pocket. Goods sit in two small
  // clusters at the pocket edges with visible gaps between items — never a
  // heap. Barrel/chest are center-origin assets: y offset lifts them onto
  // the ground.
  { file: '/models/village/market.gltf', pos: [16, 0, 2.5], rotY: faceTo(16, 2.5, 0, -1), scale: 5 },
  { file: '/models/village/tent.gltf', pos: [19, 0, -9.5], rotY: faceTo(19, -9.5, 14.5, -3), scale: 6.5 },
  // Pocket SE corner lamp (drives LAMP_LIGHTS)
  { file: '/models/props/post_lantern.gltf', pos: [20.6, 0, -3.6], rotY: 0, scale: 1, light: true },
  // Display row — evenly bays along the stall front, clear gaps between items
  { file: '/models/props/crate_open.gltf', pos: [13.4, 0, -3.3], rotY: 0.5, scale: 4 },
  { file: '/models/props/chest.gltf', pos: [15.6, 0.84, -3.2], rotY: -0.7, scale: 0.8 },
  { file: '/models/props/barrel.gltf', pos: [17.4, 0.7, -3.3], rotY: 0.2, scale: 0.7 },
  // Pocket mouth pair beside the plaza road + one sack anchoring the tent side
  { file: '/models/props/crate_open.gltf', pos: [12, 0, -2.6], rotY: -0.6, scale: 4 },
  { file: '/models/props/barrel.gltf', pos: [10.6, 0.7, -3], rotY: 0.4, scale: 0.7 },
  { file: '/models/props/sack.gltf', pos: [17.8, 0, -6.2], rotY: 2.9, scale: 10 },
  // Zone D residential: 3 houses N/S/W of the courtyard; the east side is
  // left open to the plaza (P3 enters the yard from the market road).
  { file: '/models/village/home_a.gltf', pos: [-19.5, 0, -1.5], rotY: faceTo(-19.5, -1.5, ...COURT), scale: 7 },
  { file: '/models/village/home_b.gltf', pos: [-12, 0, -14], rotY: faceTo(-12, -14, ...COURT), scale: 6.5 },
  { file: '/models/village/home_b.gltf', pos: [-11, 0, 13], rotY: faceTo(-11, 13, ...COURT), scale: 7 },
  // Longhouse + forge at the courtyard's SW edge
  { file: '/models/village/barracks.gltf', pos: [-27, 0, -15], rotY: faceTo(-27, -15, ...COURT), scale: 5 },
  { file: '/models/props/anvil.gltf', pos: [-15, 0, -10.5], rotY: -0.8, scale: 1.5 },
  { file: '/models/props/torch_lit.gltf', pos: [-15.9, 0.45, -11.2], rotY: 0, scale: 1.2, light: true },
  { file: '/models/props/torch_lit.gltf', pos: [-14.2, 0.45, -11.5], rotY: 0, scale: 1.2 },
  { file: '/models/props/post_lantern.gltf', pos: [-12, 0, -4.5], rotY: 0, scale: 1, light: true },
);
// ---- Landmark dressing (feat/environment-polish) ----
// Whispering Ruins (~31,5): a collapsed courtyard around the puzzle focal
// stone. Hero sequence on the P6 approach: foreground south gateway you walk
// through -> midground broken courtyard (walls, asymmetric columns, fallen
// masonry) -> background arched-window silhouette behind it. Heights step
// down: gate 6u > pillar 5.8 > walls ~4.8 > column stub ~1.7 > low rubble.
PROPS.push(
  // Foreground gateway: walk THROUGH the carved opening (piers only collide).
  { file: '/models/env/wall_gated.gltf', pos: [30, 0, 1.6], rotY: 0, scale: 1.5 },
  // One amber flame on the gate pier; everything else reads teal + dusk.
  { file: '/models/props/torch_lit.gltf', pos: [32.35, 0.45, 1.6], rotY: 0, scale: 1.1, light: true },
  // Midground: L of broken walls, unequal scales/rotations, east side open
  // to the approach so the courtyard reads as one broken space.
  { file: '/models/env/wall_broken.gltf', pos: [33.2, 0, 9.2], rotY: -0.12, scale: 1.2 },
  { file: '/models/env/wall_broken.gltf', pos: [36.9, 0, 4.4], rotY: 1.45, scale: 1.05 },
  // Broken column beside the focal stone: upright, tent-sized cuboid
  // footprint pins the capsule; height contrasts the NE pillar (not twins).
  { file: '/models/env/column.gltf', pos: [33.6, 0, 4.2], rotY: 0, scale: 1.2 },
  { file: '/models/env/pillar.gltf', pos: [37.4, 0, 8.6], rotY: 0.4, scale: 1.45 },
  // Background silhouette: open arch framing the sky behind the courtyard.
  { file: '/models/env/wall_archedwindow_open.gltf', pos: [26.3, 0, 11.8], rotY: 0.15, scale: 1.4 },
  // Fallen masonry lying at angles between the stones.
  { file: '/models/env/rubble_large.gltf', pos: [33.9, 0, 2.6], rotY: 0.9, scale: 0.6 },
  { file: '/models/env/rubble_large.gltf', pos: [27.6, 0, 4.3], rotY: -0.5, scale: 0.45 },
  { file: '/models/env/rubble_large.gltf', pos: [30.9, 0, 8.9], rotY: 2.4, scale: 0.7 },
  // Dead grass + scattered footing stones between the masonry (walk-over).
  { file: '/models/env/Grass_2_A_Color1.gltf', pos: [28.8, 0, 7.3], rotY: 0.3, scale: 0.9 },
  { file: '/models/env/Grass_2_A_Color1.gltf', pos: [35.0, 0, 3.0], rotY: 1.8, scale: 0.7 },
  { file: '/models/props/stone.gltf', pos: [29.2, 0, 2.8], rotY: 1.1, scale: 0.6 },
  { file: '/models/props/stone.gltf', pos: [31.6, 0, 6.6], rotY: 0.4, scale: 0.5 },
  { file: '/models/props/stone.gltf', pos: [34.6, 0, 3.4], rotY: 2.2, scale: 0.7 },
  // Small graveyard cluster in the NE corner: three stones, varied tilt and
  // size, bunched together — never a row.
  { file: '/models/props/gravestone.gltf', pos: [36.2, 0, 2.2], rotY: 0.35, scale: 0.9 },
  { file: '/models/props/gravestone.gltf', pos: [37.1, 0, 2.9], rotY: -0.5, scale: 0.65 },
  { file: '/models/props/grave_a.gltf', pos: [36.6, 0, 1.2], rotY: 1.2, scale: 0.8 },
  { file: '/models/props/post_skull.gltf', pos: [37.6, 0, 6.0], rotY: 0.6, scale: 1 },
  // Ancient Tree clearing: grand ritual site. Calm outer ring with a wide
  // south gap for the plaza approach (P7 runs x~0 from z~27), quiet inner
  // arc behind the tree, two column pairs only, rubble kept outside the ring.
  ...stoneArc(0, 31, 9.5, -Math.PI / 2 + 0.55, Math.PI * 1.5 - 0.55, 10, 0.7),
  ...stoneArc(0, 31, 5.2, 0.25 * Math.PI, 0.75 * Math.PI, 4, 0.6),
  { file: '/models/env/column.gltf', pos: [-2.6, 0, 27], rotY: 0, scale: 2 },
  { file: '/models/env/column.gltf', pos: [2.6, 0, 27], rotY: 0, scale: 2 },
  { file: '/models/env/column.gltf', pos: [-6.2, 0, 37.5], rotY: 0.3, scale: 2 },
  { file: '/models/env/column.gltf', pos: [6.2, 0, 37.5], rotY: -0.3, scale: 2 },
  { file: '/models/env/rubble_large.gltf', pos: [-9.5, 0, 36.5], rotY: 2.1, scale: 0.6 },
  { file: '/models/env/rubble_large.gltf', pos: [10, 0, 36], rotY: 0.9, scale: 0.6 },
  { file: '/models/props/post_lantern.gltf', pos: [-6.7, 0, 24.3], rotY: 0.7, scale: 1, light: true },
  { file: '/models/props/post_lantern.gltf', pos: [6.7, 0, 24.3], rotY: -0.7, scale: 1 },
  // Lake crystal focal: one height-stepped cluster on the NE rim — tall
  // center, low sides — visible from the east approach, nothing scattered elsewhere.
  { file: '/models/props/Gem_Large.gltf', pos: [-24.6, 0, 11], rotY: 0.4, scale: 2.4 },
  { file: '/models/props/Gem_Large.gltf', pos: [-23.8, 0, 11.7], rotY: -0.7, scale: 1.4 },
  { file: '/models/props/Gem_Medium.gltf', pos: [-25.2, 0, 11.9], rotY: 1.9, scale: 1.2 },
  // Grove hero: the glowing cap cluster rings one mossy stone pillar — the
  // grove's only solid decor bump (tent-sized cuboid footprint pins the
  // capsule; trunks beyond r32 stay visual-only).
  { file: '/models/env/column.gltf', pos: [29.4, 0, -25.6], rotY: 0.5, scale: 4.4 },
);


/** Solid-prop half-extents at scale 1 (measured world AABBs), keyed by file.
 *  Drives cuboid colliders + the footprint sweep below. */
export const BUILDING_HALF: Record<string, [number, number, number]> = {
  '/models/village/home_a.gltf': [0.396, 0.93, 0.427],
  '/models/village/home_b.gltf': [0.4375, 1.28, 0.55],
  '/models/village/market.gltf': [0.8995, 0.982, 0.658],
  '/models/village/barracks.gltf': [0.72, 1.64, 0.783],
  '/models/village/well.gltf': [0.326, 0.826, 0.3755],
  '/models/village/watchtower.gltf': [0.5225, 1.113, 0.5225],
  '/models/village/tent.gltf': [0.258, 0.516, 0.258],
  '/models/props/bench.gltf': [0.875, 0.5, 0.375],
  '/models/props/anvil.gltf': [0.8, 0.8, 0.375],
  '/models/props/sign_left.gltf': [0.8, 2, 0.3],
  '/models/props/sign_right.gltf': [0.8, 2, 0.3],
  '/models/props/post_lantern.gltf': [0.22, 3.3, 0.783],
  '/models/props/post_skull.gltf': [0.22, 3.3, 0.783],
  '/models/props/gravestone.gltf': [0.7, 1.6, 0.2],
  '/models/props/grave_a.gltf': [1, 2.13, 0.5],
  '/models/env/wall_gated.gltf': [2, 4, 0.5],
  '/models/env/pillar.gltf': [0.75, 4, 0.75],
  '/models/env/wall_broken.gltf': [2, 4, 0.5],
  '/models/env/wall_archedwindow_open.gltf': [2, 4, 0.5],
  '/models/env/column.gltf': [0.35, 1.4, 0.35],
  '/models/env/Tree_1_C_Color1.gltf': [0.32, 7.4, 0.32], // village hero trunk
};

/** Decorative props that stay walk-over (low benches, thin signs, forge
 *  clutter). They keep BUILDING_HALF footprints for the vegetation sweep but
 *  get no physics collider: their rotY-expanded AABBs are much larger than
 *  the real visual and were blocking routes the player can plainly walk. */
export const NO_COLLIDE: Record<string, true> = {
  '/models/props/bench.gltf': true,
  '/models/props/sign_left.gltf': true,
  '/models/props/sign_right.gltf': true,
  '/models/props/anvil.gltf': true,
  '/models/props/gravestone.gltf': true,
  '/models/props/grave_a.gltf': true,
  '/models/props/post_skull.gltf': true,
  '/models/props/torch_lit.gltf': true,
  '/models/env/wall_archedwindow_open.gltf': true,
};
/** Ancient Tree at (0,31): rendered by Regions.tsx (Tree_1_C_Color1); trunk collider derives from this. */
export const ANCIENT_TREE = { x: 0, z: 34, r: 0.32 * 4.8, h: 7.4 * 4.8 }; // pos/scale mirrored from Regions.tsx

/** (Fences dropped with the residential rebuild: the yard reads open.) */
export const FENCES: Inst[] = [];

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
// Lilies hug the inner ring (rMin keeps the open water center empty); capped count.
for (let i = 0; i < 8; i++) {
  const p = disk(-29, 6, 3, 6);
  if (p) LILIES.push({ pos: [p[0], 0.03, p[1]], rotY: rnd(0, Math.PI * 2), scale: rnd(6, 10) });
}
export const WATERPLANTS: Inst[] = [];
for (let i = 0; i < 12; i++) {
  const a = rng() * Math.PI * 2, r = rnd(6.9, 8.4);
  const x = -29 + Math.cos(a) * r * 1.1, z = 6 + Math.sin(a) * r;
  if (distToPaths(x, z) < 2) continue;
  WATERPLANTS.push({ pos: [x, 0.02, z], rotY: rnd(0, Math.PI * 2), scale: rnd(6, 9) });
}

/** Mushroom Grove: DENSE + strange — a Tree_2/Tree_3 enclosure ring and an
 * S-curving corridor of paired trunks flank the winding P5 approach (offset
 * ~1.9u from the walking line, alternating sides so the trail reads as it
 * snakes), mid bushes close the middle layer, and a stacked hero cluster of
 * tallest caps anchors the clearing center. */
const groveTree = (x: number, z: number, kind: Tree['kind'], s: number) =>
  TREES.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: (s * 2.3) / treeNorm[kind], kind, collider: Math.hypot(x, z) < 32, shadow: true });
// corridor pairs: outer row then inner bow of the S
for (const [x, z, k] of [[22.9, -17.8, 3], [21.0, -22.4, 4], [25.1, -18.9, 4], [24.4, -23.4, 3], [27.0, -19.5, 3], [26.6, -23.9, 4]] as const) {
  groveTree(x, z, k, rnd(1.2, 1.7));
}
// enclosure ring: taller at the rim, gaps where P5 threads in
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2 + rnd(-0.15, 0.15);
  const r = rnd(6.5, 9);
  const x = 28 + Math.cos(a) * r * 1.15, z = -22 + Math.sin(a) * r;
  if (!keepClear(x, z, 1.9, 0.6)) continue;
  groveTree(x, z, i % 2 === 0 ? 3 : 4, rnd(1.2, 1.8));
}
// mid-layer bushes between ring and clearing (walk-over)
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2 + rnd(-0.18, 0.18);
  const r = rnd(4.8, 6.2);
  const x = 28 + Math.cos(a) * r, z = -22 + Math.sin(a) * r;
  if (!keepClear(x, z, 1.6, 0.4)) continue;
  BUSHES.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: rnd(2.0, 2.9) });
}
// background silhouettes behind the clearing
for (const [x, z, s] of [[29.6, -24.4, 1.5], [31.3, -23.2, 1.2], [28.2, -25.6, 1.35]] as const) {
  BARE_TREES.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: s });
}
/** Glowing grove: hero stack of tall caps at the clearing center, brightest
 * tint, ring scatter stepping down/out from it. */
export const MUSHROOMS: InstC[] = [];
for (const [x, z, s, t] of [[28, -22, 3, 0.8], [28.9, -21.5, 2.2, 0.68], [27.2, -22.5, 1.7, 0.58], [28.4, -22.9, 2.4, 0.75]] as const) {
  MUSHROOMS.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: s, tint: t });
}
for (const [cx, cz, n, r0, r1] of [[28, -22, 10, 5, 8], [25.5, -18.5, 4, 1.2, 2.5], [31, -25, 5, 2, 4]] as const) {
  for (let i = 0; i < n; i++) {
    const p = disk(cx, cz, r0, r1);
    if (!p || !keepClear(p[0], p[1], 1.2, 0.8)) continue;
    MUSHROOMS.push({ pos: [p[0], 0, p[1]], rotY: rnd(0, Math.PI * 2), scale: rnd(1.0, 2.2), tint: rnd(0.5, 0.8) });
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

/** Partial stone ring: n stones spaced between angles a0..a1 (radians, 0 = +x). */
function stoneArc(cx: number, cz: number, r: number, a0: number, a1: number, n: number, s: number): Prop[] {
  const out: Prop[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / (n - 1);
    out.push({ file: '/models/props/stone.gltf', pos: [cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r], rotY: rnd(0, Math.PI), scale: s });
  }
  return out;
}

export const LAMP_LIGHTS: [number, number, number][] = PROPS.filter((p) => p.light).map((p) => {
  // Torch flame tip: authored base sinks below y=0, so the light sits at
  // 1.35*scale above the ground plane — the visual flame, not +0.44u over it.
  if (p.file.includes('torch_lit')) return [p.pos[0], 1.35 * p.scale, p.pos[2]];
  const h = p.file.includes('post_lantern') ? 3.0 : p.file.includes('lantern') ? 3.3 : 1;
  return [p.pos[0], p.pos[1] + h * p.scale, p.pos[2]];
});

/** Surface under a world (x,z) point, for surface-aware footsteps.
 *  dirt = on a path, stone = lake shore / ruins clearing, grass = elsewhere. */
export function surfaceAt(x: number, z: number): 'dirt' | 'grass' | 'stone' {
  if (distToPaths(x, z) < 2.2) return 'dirt';
  if (Math.hypot(x + 29, z - 6) < 9) return 'stone'; // lake shore
  if (Math.hypot(x - 31, z - 5) < 9) return 'stone'; // ruins clearing
  return 'grass';
}

