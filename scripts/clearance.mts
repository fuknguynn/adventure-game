// Clearance audit for the rebuilt village (run: npx vite-node scripts/clearance.mts)
// Analytic: builds every solid collider footprint from the layout module, then
// measures (a) edge-to-edge gaps between major structures, (b) canopy vs house
// overlap, (c) corridor clearance along every path sample, (d) spawn safety.
import { PROPS, PATHS, PATH_SAMPLES, TREES, ROCKS, FENCES, BUILDING_HALF, NO_COLLIDE, ANCIENT_TREE } from '../src/regions/villageLayout';

const PLAYER = 2.54, CAPSULE = 0.4;
// measured authored widths (from probe-village): canopy radius = half of these
const KIND_W = [3.181, 4.007, 6.691, 2.6, 3.093, 3.082];

interface Box { cx: number; cz: number; hw: number; hd: number; rot: number; label: string; h: number }
const rot8 = (b: Box): Box => ({ ...b, hw: Math.abs(Math.cos(b.rot)) * b.hw + Math.abs(Math.sin(b.rot)) * b.hd, hd: Math.abs(Math.sin(b.rot)) * b.hw + Math.abs(Math.cos(b.rot)) * b.hw, rot: 0 });

const buildings: Box[] = [];
for (const p of PROPS) {
  const m = BUILDING_HALF[p.file];
  if (NO_COLLIDE[p.file]) continue; // walk-over decor: no collider, not a blocker
  if (!m) continue;
  if (p.file.includes('wall_gated')) continue; // piers: carve handled separately, not a corridor blocker
  buildings.push(rot8({ cx: p.pos[0], cz: p.pos[2], hw: m[0] * p.scale, hd: m[2] * p.scale, rot: p.rotY, label: `${p.file.split('/').pop()}@${p.pos[0]},${p.pos[2]}`, h: m[1] * p.scale }));
}
buildings.push(rot8({ cx: ANCIENT_TREE.x, cz: ANCIENT_TREE.z, hw: ANCIENT_TREE.r, hd: ANCIENT_TREE.r, rot: 0, label: 'ancient-tree', h: ANCIENT_TREE.h }));

const trunks: Box[] = TREES.filter((t) => t.collider).map((t) => ({ cx: t.pos[0], cz: t.pos[2], hw: 0.3 * t.scale, hd: 0.3 * t.scale, rot: 0, label: `tree${t.kind}@${t.pos[0].toFixed(1)},${t.pos[1].toFixed(1)}`, h: 4.4 * t.scale, scale: t.scale, kind: t.kind } as Box & { scale: number; kind: number }));
const bigRocks: Box[] = ROCKS.filter((r) => r.scale >= 1.4).map((r) => ({ cx: r.pos[0], cz: r.pos[2], hw: 0.35 * r.scale, hd: 0.35 * r.scale, rot: 0, label: `rock@${r.pos[0].toFixed(1)},${r.pos[2].toFixed(1)}`, h: 0.6 * r.scale }));
const solids: Box[] = [...buildings, ...trunks, ...bigRocks];

// AABB edge-to-edge clearance between two boxes (0 = overlap)
const gap = (a: Box, b: Box) => {
  const dx = Math.abs(a.cx - b.cx) - (a.hw + b.hw);
  const dz = Math.abs(a.cz - b.cz) - (a.hd + b.hd);
  if (dx >= 0 && dz >= 0) return Math.hypot(dx, dz);
  return Math.max(dx, dz); // negative = penetration depth
};

console.log('=== A. major building pairs closer than 5u (target >=5, 2-3 player widths) ===');
for (let i = 0; i < buildings.length; i++)
  for (let j = i + 1; j < buildings.length; j++) {
    const g = gap(buildings[i], buildings[j]);
    if (g < 5) console.log(`  ${g < 0 ? 'OVERLAP' : 'tight '} ${g.toFixed(2)}u  ${buildings[i].label} <-> ${buildings[j].label}`);
  }

console.log('=== B. tree trunk/canopy vs house footprints (mandatory: no intersection, canopy must not crush roof) ===');
for (const t of TREES.filter((x) => x.collider)) {
  const tb = { cx: t.pos[0], cz: t.pos[2], hw: 0.3 * t.scale, hd: 0.3 * t.scale, rot: 0, label: '', h: 0 } as Box;
  const canopyR = (KIND_W[t.kind] / 2) * t.scale;
  for (const b of buildings.filter((x) => x.label.endsWith('Color1.gltf@-2.5,0,-3.5') === false && x.label.includes('Color1') === false)) {
    const g = gap(tb, b);
    if (g < 0) console.log(`  TRUNK-INTO ${(-g).toFixed(2)}u  ${t.pos[0].toFixed(1)},${t.pos[2].toFixed(1)} k${t.kind} into ${b.label}`);
    else if (canopyR > g + 0.5 && t.scale > 0.55) console.log(`  canopy-crush ${(canopyR - g).toFixed(2)}u  tree ${t.pos[0].toFixed(1)},${t.pos[2].toFixed(1)} k${t.kind} (r${canopyR.toFixed(2)}) over ${b.label}`);
  }
}

console.log('=== C. corridor clearance along paths (nearest solid surface minus capsule; FAIL < 0.4u) ===');
for (let pi = 0; pi < PATHS.length; pi++) {
  const samples = PATH_SAMPLES[pi];
  const worst: { d: number; x: number; z: number; by: string }[] = [];
  for (const [x, z] of samples) {
    let best = 99; let by = '';
    for (const s of solids) {
      const dx = Math.abs(x - s.cx) - s.hw - CAPSULE;
      const dz = Math.abs(z - s.cz) - s.hd - CAPSULE;
      const d = dx >= 0 && dz >= 0 ? Math.hypot(dx, dz) : Math.max(dx, dz);
      if (d < best) { best = d; by = s.label; }
    }
    worst.push({ d: best, x, z, by });
  }
  worst.sort((a, b) => a.d - b.d);
  const w = worst.slice(0, 3);
  console.log(`  path${pi} ${PATHS[pi][0]}->${PATHS[pi][PATHS[pi].length - 1]}: min ${w[0].d.toFixed(2)}u @ ${w[0].x.toFixed(1)},${w[0].z.toFixed(1)} by ${w[0].by}${w[1] && w[1].d < 1.2 ? `; also ${w[1].d.toFixed(2)} @ ${w[1].x.toFixed(1)},${w[1].z.toFixed(1)} ${w[1].by}` : ''}`);
}

console.log('=== D. spawn / POI safety (any solid within capsule reach of fixed gameplay points) ===');
for (const [x, z, r, name] of [[0, 6, CAPSULE, 'spawn'], [2, 2, CAPSULE, 'spirit'], [-3, 0, CAPSULE, 'npc']] as const) {
  for (const s of solids) {
    const dx = Math.abs(x - s.cx) - s.hw, dz = Math.abs(z - s.cz) - s.hd;
    const d = dx >= 0 && dz >= 0 ? Math.hypot(dx, dz) : Math.max(dx, dz);
    if (d < r) console.log(`  ${name} blocked by ${s.label} (d=${d.toFixed(2)})`);
  }
}

console.log('=== E. gate corridor x in [-4,4], z in [8,15] and market approach z -1.5..-4, x 0..16 ===');
for (const s of solids) {
  if (Math.abs(s.cx) <= 4 + s.hw && s.cz + s.hd > 8 && s.cz - s.hd < 15) console.log(`  gate-corridor solid: ${s.label} cz=${s.cz.toFixed(1)} hw=${s.hw.toFixed(1)}`);
}
console.log('=== F. market footprint vs P2 samples ===');
for (const [x, z] of PATH_SAMPLES[1]) {
  let nearest = 99; let by = '';
  for (const s of buildings.filter((b) => b.cx > 6)) {
    const dx = Math.abs(x - s.cx) - s.hw - CAPSULE, dz = Math.abs(z - s.cz) - s.hd - CAPSULE;
    const d = dx >= 0 && dz >= 0 ? Math.hypot(dx, dz) : Math.max(dx, dz);
    if (d < nearest) { nearest = d; by = s.label; }
  }
  if (nearest < 0.8) console.log(`  P2 tight @ ${x.toFixed(1)},${z.toFixed(1)}: ${nearest.toFixed(2)}u by ${by}`);
}
