import { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import { GLTFLoader, SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { keys, joyMove, touchFlags, camOrbit, pausedFlag } from './input';
import { loco } from './locomotion';
import { useLocomotion } from './useLocomotion';
import { useProfile } from '../stores/stores';
import { CHARACTERS } from '../data/gameData';
import { sfx } from '../systems/AudioSystem';

export const playerPos = new THREE.Vector3(0, 1, 6);

export const SPAWNS: Record<string, [number, number, number]> = {
  village_entrance: [0, 1, 6],
  trail_head: [0, 1, -18],
  grove_entry: [22, 1, -18],
  lake_entry: [-22, 1, 4],
  ruins_entry: [24, 1, 4],
  tree_entry: [0, 1, 24],
};

export function Player({ onInteract }: { onInteract: () => void }) {
  const { characterId } = useProfile();
  const def = CHARACTERS.find((c) => c.id === characterId) ?? CHARACTERS[0];
  const gltf = useLoader(GLTFLoader, def.file);
  const rb = useRef<RapierRigidBody>(null);
  const model = useMemo(() => {
    // SkeletonUtils (not Object3D.clone): a plain clone leaves SkinnedMeshes
    // bound to the template skeleton, so mixer-driven bones never reach the
    // mesh and the character is stuck in bind T-pose while 'animating'.
    const s = SkeletonUtils.clone(gltf.scene);
    s.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; } });
    return s;
  }, [gltf]);
  const yaw = useRef(0);
  const visualYaw = useRef(0);
  const visualRef = useRef<THREE.Group>(null);
  const stepAcc = useRef(0);
  useLocomotion(model);
  useFrame((_, dt) => {
    const body = rb.current;
    if (!body) return;
    const step = Math.min(dt, 1 / 30);
    // Movement input is inert while paused (PauseView): zero the axes, but keep
    // the physics body awake and keep updating playerPos/camera follow.
    const paused = pausedFlag.v;
    let ix = paused ? 0 : (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + joyMove.x;
    let iz = paused ? 0 : (keys.back ? 1 : 0) - (keys.fwd ? 1 : 0) + joyMove.z;
    const len = Math.hypot(ix, iz);
    if (len > 1) { ix /= len; iz /= len; }
    const sprint = keys.sprint || touchFlags.sprint;
    const speed = (sprint ? 7.5 : 4.2) * (len > 0.01 ? 1 : 0);
    const cy = Math.cos(camOrbit.yaw), sy = Math.sin(camOrbit.yaw);
    // Camera basis (matches CameraRig): forward = (-sin,-cos), right = (cos,-sin); iz<0 = forward
    const wx = (ix * cy + iz * sy) * speed;
    const wz = (iz * cy - ix * sy) * speed;
    const v = body.linvel();
    const vy = v.y;
    body.setLinvel({ x: wx, y: vy, z: wz }, true);
    const p = body.translation();
    playerPos.set(p.x, p.y, p.z);
    // locomotion signals from ACTUAL physics state (stalls read as idle).
    // Dual-condition airborne test (no physics changes): rising/falling fast
    // means airborne even before y clears the rest height; apex is caught by y.
    loco.speed = Math.hypot(v.x, v.z);
    loco.grounded = p.y < 1.05 && Math.abs(vy) < 1.0;
    if (len > 0.05) {
      yaw.current = Math.atan2(wx, wz);
      stepAcc.current += step * speed;
      if (stepAcc.current > 2.2) { stepAcc.current = 0; sfx.step(); }
    }
    // face movement direction (visual only — physics untouched)
    let d = yaw.current - visualYaw.current;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    visualYaw.current += d * (1 - Math.exp(-10 * Math.min(dt, 0.05)));
    if (visualRef.current) visualRef.current.rotation.y = visualYaw.current;
    if (touchFlags.jump) {
      // Consume even while paused so a press that races the pause never
      // buffers into a jump on resume.
      touchFlags.jump = false;
      if (!paused && p.y < 1.3) body.applyImpulse({ x: 0, y: 3.2, z: 0 }, true);
    }
    if (touchFlags.interact) {
      touchFlags.interact = false;
      onInteract();
    }
  });

  return (
    <RigidBody ref={rb} colliders={false} position={SPAWNS.village_entrance} enabledRotations={[false, false, false]} linearDamping={8}>
      <CuboidCollider args={[0.45, 0.9, 0.45]} position={[0, 0, 0]} />
      <group>
        <group ref={visualRef}>
          <primitive object={model} position={[0, -0.9, 0]} />
        </group>
      </group>
    </RigidBody>
  );
}

/** Flat bounded world: ground + invisible rim walls (simple, no fall-through). */
export function GroundBounds() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[60, 0.5, 60]} position={[0, -0.5, 0]} />
        {/* rim walls */}
        <CuboidCollider args={[60, 4, 1]} position={[0, 2, -46]} />
        <CuboidCollider args={[60, 4, 1]} position={[0, 2, 46]} />
        <CuboidCollider args={[1, 4, 60]} position={[-46, 2, 0]} />
        <CuboidCollider args={[1, 4, 60]} position={[46, 2, 0]} />
      </RigidBody>
    </group>
  );
}
