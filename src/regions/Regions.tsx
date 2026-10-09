import { useMemo } from 'react';
import * as THREE from 'three';
import { KayKitModel } from '../game/Model';
import { VillageScenery, FOLIAGE_TINT } from './VillageScenery';
import { PROPS, FIREFLIES } from './villageLayout';
import { useProgress } from '../stores/stores';

/** Hub-and-spoke world. Layout data (villageLayout.ts) drives instanced scenery;
 *  landmarks (gems, ruins, ancient tree) stay individual models. */
export function Regions() {
  const { worldRestored, solvedPuzzles } = useProgress();
  const groveDone = solvedPuzzles.includes('spirit_path');
  const lakeDone = solvedPuzzles.includes('rune_sequence');
  const ruinsDone = solvedPuzzles.includes('light_reflection');

  const gems: Array<[number, number, number, number]> = [[-28, 0, 4, lakeDone ? 1.6 : 0.7], [-30, 0, 8, lakeDone ? 1.6 : 0.7], [30, 0, -24, groveDone ? 1.8 : 0.8]];

  return (
    <group>
      {/* base ground: slightly darker so village grass disc reads as a zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[52, 56]} />
        <meshStandardMaterial color={worldRestored ? '#245c3c' : '#1d3f2e'} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[36, 48]} />
        <meshStandardMaterial color={worldRestored ? '#2c6647' : '#254c38'} />
      </mesh>
      {/* lake: disc + darker shore ring + subtle emissive (kept static per perf rule) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-29, 0.006, 6]}>
        <circleGeometry args={[7.6, 36]} />
        <meshStandardMaterial color="#132b33" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-29, 0.02, 6]}>
        <circleGeometry args={[7, 36]} />
        <meshStandardMaterial color={lakeDone ? '#5fd4e8' : '#27718a'} transparent opacity={0.9} emissive={lakeDone ? '#2fb9d4' : '#0a2f3c'} emissiveIntensity={lakeDone ? 0.9 : 0.3} />
      </mesh>
      {/* instanced scatter + ground treatment + colliders */}
      <VillageScenery />
      {/* individual props (storytelling + landmarks) */}
      {PROPS.map((p, i) => (
        <KayKitModel key={`pr${i}`} url={p.file} position={p.pos} scale={p.scale} rotationY={p.rotY}
          colorize={p.file.includes('Tree_1_C') ? FOLIAGE_TINT : undefined} />
      ))}
      {/* grove: luminous gems */}
      {gems.map(([x, y, z, e], i) => (
        <group key={`g${i}`} position={[x, y, z]}>
          <mesh position={[0, 1.2, 0]}>
            <icosahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color="#8ef0ff" emissive="#39d7ff" emissiveIntensity={e} />
          </mesh>
          <pointLight color="#54e0ff" intensity={e * 4} distance={9} decay={2} position={[0, 1.4, 0]} />
        </group>
      ))}
      {/* ruins puzzle focal stone (grows when light_reflection solved) */}
      <KayKitModel url="/models/props/stone.gltf" position={[30, 0, 5]} scale={ruinsDone ? 1.4 : 1} />
      {/* ancient tree: grand verified tree + shrine + light */}
      <KayKitModel url="/models/env/Tree_1_C_Color1.gltf" position={[0, 0, 34]} scale={4.2} colorize={FOLIAGE_TINT} />
      <KayKitModel url="/models/env/shrine_green.gltf" position={[0, 0, 30]} scale={1.4} />
      <pointLight color={worldRestored ? '#ffe9a8' : '#9ff5e8'} intensity={worldRestored ? 30 : 10} distance={22} decay={2} position={[0, 5, 32]} />
      <FirefliesPoints restored={worldRestored} />
    </group>
  );
}

/** Fireflies as a single Points object (was 50-90 meshes = draw-call hell). */
function FirefliesPoints({ restored }: { restored: boolean }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pts = FIREFLIES.map(([x, y, z]) => [x, y, z] as [number, number, number]);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
    return g;
  }, []);
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.22} map={tex} color={restored ? '#ffe9a0' : '#cfe9ff'} transparent opacity={0.85} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
