import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { InsectField } from '../regions/population';

/** Deterministic per-particle params from field id + index (stable across reloads). */
function hash01(seed: number): number {
  let h = (seed | 0) * 2654435761;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** One insect field as a single THREE.Points (FirefliesPoints pattern):
 *  per-particle sine-wave bob + slow drift, additive blending, one draw call. */
export function InsectPoints({ field }: { field: InsectField }) {
  const { geo, params } = useMemo(() => {
    const n = field.count;
    const pos = new Float32Array(n * 3);
    const params: { baseX: number; baseY: number; baseZ: number; phase: number; r: number; drift: number }[] = [];
    for (let i = 0; i < n; i++) {
      const a = hash01(i * 7 + field.id.length) * Math.PI * 2;
      const r = Math.sqrt(hash01(i * 13 + 3)) * field.radius;
      const bx = field.center[0] + Math.cos(a) * r;
      const by = field.center[1] + (hash01(i * 17 + 5) - 0.5) * 1.2;
      const bz = field.center[2] + Math.sin(a) * r;
      pos[i * 3] = bx; pos[i * 3 + 1] = by; pos[i * 3 + 2] = bz;
      params.push({
        baseX: bx, baseY: by, baseZ: bz,
        phase: hash01(i * 23 + 11) * Math.PI * 2,
        r: 0.3 + hash01(i * 29 + 13) * 0.6,
        drift: 0.2 + hash01(i * 31 + 17) * 0.4,
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo: g, params };
  }, [field]);

  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const attr = geo.getAttribute('position') as THREE.BufferAttribute;
    const { amp = 0.25, speed = 1.2 } = field.bob ?? {};
    for (let i = 0; i < params.length; i++) {
      const p = params[i];
      attr.setXYZ(
        i,
        p.baseX + Math.sin(t * p.drift + p.phase) * p.r,
        p.baseY + Math.sin(t * speed + p.phase) * amp,
        p.baseZ + Math.cos(t * p.drift * 0.8 + p.phase) * p.r,
      );
    }
    attr.needsUpdate = true;
  });

  return (
    <points geometry={geo}>
      <pointsMaterial size={0.18} map={tex} color={field.color} transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
