import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { keys, joyMove } from '../game/input';
import { loco } from '../game/locomotion';
import { debugLoco } from '../game/useLocomotion';
import { playerPos } from '../game/Player';

/** Shared mutable physics snapshot for the temporary debug overlay. */
export const debugPhys = { bodies: -1, linvel: 0, sleeping: '?', vy: 0 };

/** Latest player body handle, published by Player for the sampler. */
export const debugBodyHandle: { current: { isSleeping: () => boolean; linvel: () => { x: number; y: number; z: number } } | null } = { current: null };

/** rAF rate EMA — distinguishes a frozen skeleton from a starved one. */
export const fpsEma = { v: 0 };

/** Lives inside <Physics>; samples world step state. Mounted only with ?debugKeys=1. */
export function DebugPhysSampler() {
  const { world } = useRapier();
  useFrame(() => {
    try {
      debugPhys.bodies = world.bodies.len();
    } catch {
      debugPhys.bodies = -2;
    }
    const b = debugBodyHandle.current;
    if (b) {
      try {
        const v = b.linvel();
        debugPhys.linvel = +Math.hypot(v.x, v.z).toFixed(2);
        debugPhys.vy = +v.y.toFixed(2);
        debugPhys.sleeping = b.isSleeping() ? 'YES' : 'no';
      } catch {
        debugPhys.sleeping = 'ERR';
      }
    }
  });
  return null;
}

/** TEMPORARY key-delivery witness. Only mounts with ?debugKeys=1. Deleted after diagnosis. */
export function DebugKeys() {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!location.search.includes('debugKeys')) return;
    let last = performance.now();
    let raf = 0;
    const loop = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      fpsEma.v = fpsEma.v * 0.9 + (dt > 0 ? 1 / dt : 0) * 0.1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => { clearInterval(id); cancelAnimationFrame(raf); };
  }, []);
  if (!location.search.includes('debugKeys')) return null;
  const dot = (on: boolean) => (on ? '#7df0d4' : '#33463b');
  return (
    <div style={{ position: 'fixed', right: 12, bottom: 90, zIndex: 60, background: 'rgba(0,0,0,.75)', border: '1px solid #d8bb78', borderRadius: 10, padding: 10, fontFamily: 'monospace', fontSize: 13, color: '#f4e9c9', pointerEvents: 'none' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        {(['fwd', 'left', 'back', 'right'] as const).map((k) => (
          <span key={k} style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 6, background: dot(keys[k]) }}>
            {{ fwd: 'W', left: 'A', back: 'S', right: 'D' }[k]}
          </span>
        ))}
        <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 6, background: dot(keys.sprint) }}>⇧</span>
      </div>
      <div>joy=({joyMove.x.toFixed(1)},{joyMove.z.toFixed(1)}) spd={loco.speed.toFixed(1)} gnd={String(loco.grounded)} anim={debugLoco.state}</div>
      <div>pos=({playerPos.x.toFixed(1)},{playerPos.y.toFixed(1)},{playerPos.z.toFixed(1)})</div>
      <div>bodies={debugPhys.bodies} linvel={debugPhys.linvel} sleep={debugPhys.sleeping} vy={debugPhys.vy.toFixed(1)}</div>
      <div>fps={fpsEma.v.toFixed(0)}</div>
    </div>
  );
}
