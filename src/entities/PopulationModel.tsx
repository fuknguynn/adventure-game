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
    if (entry.wander) {
      const { radius, speed } = entry.wander;
      const w1 = speed / radius; // primary axis: max speed = radius * w1 = speed
      const w2 = w1 * 0.7; // secondary axis: different freq => non-repeating path
      const t = localT.current;
      const nx = (Math.sin(t * w1 + phase) - Math.sin(phase)) * radius;
      const nz = (Math.cos(t * w2 + phase * 1.3) - Math.cos(phase * 1.3)) * radius;
      // Face the movement direction (yaw toward velocity).
      const vx = Math.cos(t * w1 + phase) * w1;
      const vz = -Math.sin(t * w2 + phase * 1.3) * w2;
      if (Math.abs(vx) + Math.abs(vz) > 1e-3) {
        g.rotation.y = Math.atan2(vx, vz);
      }
      g.position.set(entry.position[0] + nx, entry.position[1], entry.position[2] + nz);
    }
  });

  return (
    <group ref={group} position={entry.position} rotation={[0, entry.rotationY ?? 0, 0]}>
      <primitive object={clone} />
    </group>
  );
}
