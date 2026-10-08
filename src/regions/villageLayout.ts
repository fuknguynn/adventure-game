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

export interface Tree extends Inst { kind: 0 | 1 | 2; collider: boolean; shadow: boolean }
export const TREES: Tree[] = [];
export const TREE_FILES = ['/models/env/Tree_1_A_Color1.gltf', '/models/env/Tree_1_B_Color1.gltf', '/models/env/Tree_1_C_Color1.gltf'];
const treeNorm = [3.9, 4.6, 7.4]; // authored heights at scale 1

function addTree(x: number, z: number, s?: number, shadow = true) {
  const kind = Math.floor(rng() * 3) as 0 | 1 | 2;
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
const exitAngles = PATHS.map((p) => Math.atan2(p[p.length - 1][1], p[p.length - 1][0]));
for (let i = 0; i < 84; i++) {
  const a = (i / 84) * Math.PI * 2 + rnd(-0.02, 0.02);
  if (exitAngles.some((ea) => Math.abs(((a - ea + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.14)) continue;
  addTree(Math.cos(a) * rnd(36, 43), Math.sin(a) * rnd(36, 43), rnd(1.2, 1.8), false);
  if (i % 2 === 0) addTree(Math.cos(a + 0.03) * rnd(44, 52), Math.sin(a + 0.03) * rnd(44, 52), rnd(1.4, 2.1), false);
}

export const BUSHES: Inst[] = [];
export const GRASS: Inst[] = [];
export const ROCKS: InstC[] = [];
for (let i = 0; i < 160; i++) {
  const a = rng() * Math.PI * 2, r = 4 + Math.sqrt(rng()) * 30;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (!keepClear(x, z, 1.5, 0.4)) continue;
  const roll = rng();
  if (roll < 0.34) BUSHES.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: rnd(2.2, 4.5) });
  else if (roll < 0.82) GRASS.push({ pos: [x, 0, z], rotY: rnd(0, Math.PI * 2), scale: rnd(0.8, 1.6) });
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
  // Entrance gate + flanking lanterns
  { file: '/models/env/wall_gated.gltf', pos: [0, 0, 11.2], rotY: 0, scale: 1 },
  { file: '/models/props/lantern.gltf', pos: [-2.4, 0, 9], rotY: 0.3, scale: 0.72, light: true },
  { file: '/models/props/lantern.gltf', pos: [2.4, 0, 12.6], rotY: -0.3, scale: 0.72 },
  // Path-guiding lanterns: junction, lake path, ruins path
  { file: '/models/props/lantern.gltf', pos: [-2.2, 0, -2.5], rotY: 1.2, scale: 0.72, light: true },
  { file: '/models/props/lantern.gltf', pos: [-9, 0, 3.2], rotY: 0, scale: 0.72 },
  { file: '/models/props/lantern.gltf', pos: [9, 0, 1.8], rotY: 0, scale: 0.72, light: true },
  // Spirit clearing: ring of stones + shrine facing the spirit
  ...stoneRing(2, 2, 6.8, 9),
  { file: '/models/env/shrine_green.gltf', pos: [6.5, 0, -2.5], rotY: Math.atan2(2 - -2.5, 2 - 6.5) + Math.PI / 2, scale: 1.6 },
  // Village center storytelling cluster (storage + camp)
  { file: '/models/props/barrel.gltf', pos: [-5.5, 0, -4.5], rotY: 0.4, scale: 0.72 },
  { file: '/models/props/barrel.gltf', pos: [-6.3, 0, -5.1], rotY: 1.1, scale: 0.72 },
  { file: '/models/props/barrel.gltf', pos: [-5.9, 1.44, -4.8], rotY: 2.2, scale: 0.72 },
  { file: '/models/props/chest.gltf', pos: [-4.6, 0, -5.6], rotY: -0.7, scale: 0.8 },
  { file: '/models/props/stone.gltf', pos: [-3.9, 0, -3.8], rotY: 0.8, scale: 0.55 },
  { file: '/models/props/stone.gltf', pos: [-6.8, 0, -3.6], rotY: 2.0, scale: 0.42 },
  { file: '/models/env/pillar.gltf', pos: [-7.6, 0, -5.8], rotY: 0.5, scale: 0.9 },
  // Village banner moved off-path, next to the camp
  { file: '/models/env/banner_blue.gltf', pos: [-3.2, 0, -6.6], rotY: 0.4, scale: 1 },
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

function stoneRing(cx: number, cz: number, r: number, n: number): Prop[] {
  const out: Prop[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2;
    out.push({ file: '/models/props/stone.gltf', pos: [cx + Math.cos(a) * (r + rnd(-0.4, 0.4)), 0, cz + Math.sin(a) * (r + rnd(-0.4, 0.4))], rotY: rnd(0, Math.PI), scale: rnd(0.55, 0.85) });
  }
  return out;
}

/** Lamp point-light positions (pick subset flagged light:true). */
export const LAMP_LIGHTS: [number, number, number][] = PROPS.filter((p) => p.light).map((p) => [p.pos[0], 2.4, p.pos[2]]);

