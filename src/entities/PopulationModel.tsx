import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader, SkeletonUtils } from 'three-stdlib';
import { ModelErrorBoundary } from '../game/Model';
import { playerPos } from '../game/Player';
import type { PopulationEntry } from '../regions/population';

/** Distance beyond which the mixer + wander are skipped (fog hides the freeze). */
const PAUSE_DIST = 28;

/** Deterministic per-entry phase from id (stable across reloads). */
function phaseOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (h >>> 0) / 4294967295 * Math.PI * 2;
}

/** One population entry: error-isolated GLTF load, SkeletonUtils clone,
 *  AnimationMixer (clip-by-name or baked-range scrub), distance-pause,
 *  optional small-radius wander. No Rapier collider. */
export function PopulationModel({ entry }: { entry: PopulationEntry }) {
  return (
    <ModelErrorBoundary url={entry.model}>
      <Suspense fallback={null}>
        <Inner entry={entry} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function Inner({ entry }: { entry: PopulationEntry }) {
  const group = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const localT = useRef(0);
  const phase = useMemo(() => phaseOf(entry.id), [entry.id]);
  // Persistent flee displacement (horizontal), reset to 0 when the player is
  // out of flee range (eases back toward the authored position).
  const drift = useRef(new THREE.Vector2(0, 0));

  const gltf = useLoader(GLTFLoader, entry.model);

  // SkeletonUtils.clone (not Object3D.clone): a plain clone leaves SkinnedMeshes
  // bound to the template skeleton, so mixer-driven bones never reach the mesh.
  const clone = useMemo(() => {
    const s = SkeletonUtils.clone(gltf.scene);
    // Scale normalization: authored scale wins; else targetHeight / bbox height.
    let scale = entry.scale;
    if (scale === undefined && entry.targetHeight) {
      const box = new THREE.Box3().setFromObject(s);
      const h = box.max.y - box.min.y;
      if (h > 1e-4) scale = entry.targetHeight / h;
    }
    if (scale !== undefined) s.scale.setScalar(scale);
    s.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) o.frustumCulled = false;
    });
    return s;
  }, [gltf, entry.scale, entry.targetHeight]);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clone);
    const anim = entry.animation;
    if (anim?.clip) {
      // Separate-clip models (Quaternius / KayKit): play the named clip.
      const clip = gltf.animations.find((c) => c.name === anim.clip) ?? gltf.animations[0];
      if (clip) {
        const action = mixer.clipAction(clip);
        action.timeScale = anim.speed ?? 1;
        action.play();
      }
    } else if (anim?.start !== undefined && anim?.end !== undefined && gltf.animations[0]) {
      // Baked-timeline models (Gobkit): scrub the single embedded clip within
      // [start, end] via mixer.setTime (subclip truncates on sparse keys).
      const action = mixer.clipAction(gltf.animations[0]);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    }
    mixerRef.current = mixer;
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clone);
      mixerRef.current = null;
    };
  }, [clone, gltf, entry.animation]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    // Distance-pause: skip mixer + wander beyond PAUSE_DIST (fog hides it).
    if (playerPos.distanceTo(g.position) > PAUSE_DIST) return;
    const d = Math.min(dt, 0.1);
    localT.current += d;
    const mixer = mixerRef.current;
    if (mixer) {
      const anim = entry.animation;
      if (anim?.start !== undefined && anim?.end !== undefined) {
        const dur = Math.max(anim.end - anim.start, 1e-3);
        mixer.setTime(anim.start + (localT.current % dur));
      } else {
        mixer.update(d);
      }
    }
    // Optional small-radius wander: sin/cos (Lissajous) motion, deterministic
    // phase. Angular frequency derived so max horizontal speed == wander.speed.
    // Offsets are relative to the authored position (zero at t=0).
    let wx = 0, wz = 0, vx = 0, vz = 0, hasWander = false;
    if (entry.wander) {
      const { radius, speed } = entry.wander;
      const w1 = speed / radius; // primary axis: max speed = radius * w1 = speed
      const w2 = w1 * 0.7; // secondary axis: different freq => non-repeating path
      const t = localT.current;
      wx = (Math.sin(t * w1 + phase) - Math.sin(phase)) * radius;
      wz = (Math.cos(t * w2 + phase * 1.3) - Math.cos(phase * 1.3)) * radius;
      // Face the movement direction (yaw toward velocity).
      vx = Math.cos(t * w1 + phase) * w1;
      vz = -Math.sin(t * w2 + phase * 1.3) * w2;
      hasWander = true;
    }
    // Wildlife flee: displace horizontally away from the player while within
    // flee.dist, clamped so total drift stays within (wander.radius + 2) of
    // the authored position. Eases back (drift -> 0) when the player is far.
    // No collider — pure visual displacement.
    let fleeActive = false;
    if (entry.flee) {
      // Distance from the AMBIENT position (authored + wander) to the player,
      // not g.position — avoids a feedback loop with prior drift.
      const ax = entry.position[0] + wx;
      const az = entry.position[2] + wz;
      const dx = ax - playerPos.x;
      const dz = az - playerPos.z;
      const hdist = Math.hypot(dx, dz);
      if (hdist < entry.flee.dist) {
        fleeActive = true;
        const inv = 1 / Math.max(hdist, 1e-3);
        const awayX = dx * inv, awayZ = dz * inv;
        drift.current.x += awayX * entry.flee.speed * d;
        drift.current.y += awayZ * entry.flee.speed * d;
        const maxDrift = (entry.wander?.radius ?? 0) + 2;
        const len = Math.hypot(drift.current.x, drift.current.y);
        if (len > maxDrift) {
          const s = maxDrift / len;
          drift.current.x *= s;
          drift.current.y *= s;
        }
        // Facing = direction of flee.
        g.rotation.y = Math.atan2(awayX, awayZ);
      } else {
        // Ease back toward the ambient wander position.
        const k = 1 - Math.exp(-2.5 * d);
        drift.current.x *= 1 - k;
        drift.current.y *= 1 - k;
      }
    }
    // Final position: authored + wander offset + flee drift (Y from authored).
    g.position.set(
      entry.position[0] + wx + drift.current.x,
      entry.position[1],
      entry.position[2] + wz + drift.current.y,
    );
    // Facing: flee already set it; else NPC face-player override; else wander.
    if (!fleeActive) {
      if (entry.facePlayer) {
        const ddx = playerPos.x - g.position.x;
        const ddz = playerPos.z - g.position.z;
        if (Math.hypot(ddx, ddz) < entry.facePlayer.dist) {
          const target = Math.atan2(ddx, ddz);
          // Smooth wrap-aware lerp toward the player.
          let diff = (target - g.rotation.y + Math.PI) % (Math.PI * 2);
          if (diff < 0) diff += Math.PI * 2;
          diff -= Math.PI;
          g.rotation.y += diff * (1 - Math.exp(-6 * d));
        }
      } else if (hasWander && Math.abs(vx) + Math.abs(vz) > 1e-3) {
        g.rotation.y = Math.atan2(vx, vz);
      }
    }
  });

  return (
    <group ref={group} position={entry.position} rotation={[0, entry.rotationY ?? 0, 0]}>
      <primitive object={clone} />
    </group>
  );
}
