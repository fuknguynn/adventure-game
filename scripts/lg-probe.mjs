import { TREES, BUSHES, ROCKS, PROPS, PATH_SAMPLES } from '../src/regions/villageLayout';
const pts = [[-7, -4.2], [-21.9, -4.4]];
for (const [px, pz] of pts) {
  console.log('near', px, pz);
  for (const a of [TREES, BUSHES, ROCKS, PROPS])
    for (const p of a) {
      const q = p.pos;
      if (Math.hypot(q[0] - px, q[2] - pz) < 2.6) console.log(' ', p.file ?? ('tree' + p.kind), q[0].toFixed(1), q[2].toFixed(1), p.scale.toFixed(2), p.collider ?? '');
    }
}
console.log('P3 samples x -9..-4:', PATH_SAMPLES[2].filter((s) => s[0] > -9 && s[0] < -4).map((s) => s.map((v) => v.toFixed(1)).join(',')).join(' | '));
console.log('P3 tail:', PATH_SAMPLES[2].slice(-6).map((s) => s.map((v) => v.toFixed(1)).join(',')).join(' | '));
