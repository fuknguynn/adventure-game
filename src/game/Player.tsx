import { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
import { keys, joyMove, touchFlags, camOrbit } from './input';
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
    const s = gltf.scene.clone();
    s.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; } });
    return s;
  }, [gltf]);
  const yaw = useRef(0);
  const stepAcc = useRef(0);

  useFrame((_, dt) => {
    const body = rb.current;
    if (!body) return;
    const step = Math.min(dt, 1 / 30);
    // input direction in camera space
    let ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + joyMove.x;
    let iz = (keys.back ? 1 : 0) - (keys.fwd ? 1 : 0) + joyMove.z;
    const len = Math.hypot(ix, iz);
    if (len > 1) { ix /= len; iz /= len; }
    const sprint = keys.sprint || touchFlags.sprint;
    const speed = (sprint ? 7.5 : 4.2) * (len > 0.01 ? 1 : 0);
    const cy = Math.cos(camOrbit.yaw), sy = Math.sin(camOrbit.yaw);
    const wx = (ix * cy - iz * sy) * speed;
    const wz = (ix * -sy - iz * cy) * speed * -1;
    const v = body.linvel();
    const vy = v.y;
    body.setLinvel({ x: wx, y: vy, z: wz }, true);
    const p = body.translation();
    playerPos.set(p.x, p.y, p.z);
    if (len > 0.05) {
      yaw.current = Math.atan2(wx, wz);
      stepAcc.current += step * speed;
      if (stepAcc.current > 2.2) { stepAcc.current = 0; sfx.step(); }
    }
    if (touchFlags.jump) {
      touchFlags.jump = false;
      if (p.y < 1.3) body.applyImpulse({ x: 0, y: 3.2, z: 0 }, true);
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
        <primitive object={model} position={[0, -0.9, 0]} />
        {/* heading indicator (reads with model yaw) */}
        <group rotation={[0, 0, 0]}>
          <mesh position={[0, 1.35, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#d8bb78" emissive="#d8bb78" emissiveIntensity={1.2} />
          </mesh>
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
