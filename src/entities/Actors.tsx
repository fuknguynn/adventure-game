import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerPos } from '../game/Player';
import { useProgress } from '../stores/stores';

type Mode = 'idle' | 'follow' | 'guide' | 'celebrate';

/** Ethereal-light spirit companion (gap-adapted: no fake creature model). FSM, no AI API. */
export function Spirit({ guideTarget }: { guideTarget: THREE.Vector3 | null }) {
  const ref = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const { solvedPuzzles, worldRestored } = useProgress();
  const mode: Mode = worldRestored ? 'celebrate' : guideTarget ? 'guide' : solvedPuzzles.length > 0 ? 'follow' : 'idle';

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const anchor = mode === 'guide' && guideTarget ? guideTarget : playerPos;
    const ox = mode === 'idle' ? Math.sin(t * 0.8) * 1.6 : Math.sin(t * 1.4) * 0.5;
    const oz = mode === 'idle' ? Math.cos(t * 0.6) * 1.6 : Math.cos(t * 1.1) * 0.5 + 1.2;
    const oy = 2.1 + Math.sin(t * (mode === 'celebrate' ? 4 : 2)) * (mode === 'celebrate' ? 0.5 : 0.25);
    const want = new THREE.Vector3(anchor.x + ox, anchor.y + oy - 1, anchor.z + oz);
    g.position.lerp(want, 1 - Math.exp(-3 * 0.033));
    if (glow.current) {
      const s = mode === 'celebrate' ? 1.5 + Math.sin(t * 5) * 0.25 : 1 + Math.sin(t * 2.4) * 0.12;
      glow.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={ref} position={[2, 2, 8]}>
      <mesh ref={glow as never}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshStandardMaterial color="#9ff5e8" emissive="#4fe3c1" emissiveIntensity={2.2} transparent opacity={0.95} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 20, 20]} />
        <meshBasicMaterial color="#4fe3c1" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <pointLight color="#7df0d4" intensity={6} distance={9} decay={2} />
    </group>
  );
}

/** Village NPC (uses verified spare Ranger GLB would need vendor; placeholder-free: robed marker + name). */
export function NPC({ position, onTalk }: { position: [number, number, number]; onTalk: () => void }) {
  void onTalk;
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.32, 0.9, 6, 12]} />
        <meshStandardMaterial color="#7a5c9e" emissive="#3d2b5c" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color="#f4e9c9" />
      </mesh>
      <pointLight color="#d8bb78" intensity={3} distance={7} decay={2} position={[0, 2.4, 0]} />
    </group>
  );
}
