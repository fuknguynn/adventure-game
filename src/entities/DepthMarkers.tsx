// DepthMarkers.tsx — region-activated emissive markers for exploration depth
// content (mini-objective steps, interactables, secrets, lore). Small meshes,
// no colliders, no per-frame React state; a shared useFrame toggles the small
// pointLight within ~12u of the player.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerPos } from '../game/Player';
import { useLiveRegion } from '../systems/DepthDirector';
import { useProgress } from '../stores/stores';
import { MINI_OBJECTIVES, INTERACTABLES, SECRETS, LORE_FRAGMENTS } from '../data/depthData';

const LIGHT_RANGE = 12;

/** Toggle a small pointLight on/off when the player is within ~12u. */
function useLightToggle(pos: [number, number, number]) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const d = Math.hypot(playerPos.x - pos[0], playerPos.z - pos[2]);
    const on = d < LIGHT_RANGE;
    if (l.visible !== on) l.visible = on;
  });
  return light;
}

function EmissiveMarker({
  pos, emissive, intensity, color, lightColor,
  geometry, y = 0.6, lightIntensity = 4, lightDistance = 5,
}: {
  pos: [number, number, number];
  emissive: string;
  intensity: number;
  color?: string;
  lightColor?: string;
  geometry: 'icosahedron' | 'octahedron' | 'box' | 'torus';
  y?: number;
  lightIntensity?: number;
  lightDistance?: number;
}) {
  const light = useLightToggle(pos);
  const geo =
    geometry === 'icosahedron' ? <icosahedronGeometry args={[0.32, 0]} /> :
    geometry === 'octahedron' ? <octahedronGeometry args={[0.34, 0]} /> :
    geometry === 'torus' ? <torusGeometry args={[0.3, 0.08, 8, 20]} /> :
    <boxGeometry args={[0.5, 0.5, 0.5]} />;
  return (
    <group position={[pos[0], pos[1], pos[2]]}>
      <mesh position={[0, y, 0]} rotation={geometry === 'torus' ? [Math.PI / 2, 0, 0] : [0.4, 0.5, 0]}>
        {geo}
        <meshStandardMaterial color={color ?? '#1a2a3a'} emissive={emissive} emissiveIntensity={intensity} />
      </mesh>
      <pointLight ref={light} color={lightColor ?? emissive} intensity={lightIntensity} distance={lightDistance} decay={2} position={[0, y + 0.3, 0]} visible={false} />
    </group>
  );
}

/** Step markers for the active mini-objective (region-activated). */
export function MiniObjectiveMarkers() {
  const region = useLiveRegion((s) => s.region);
  const solvedPuzzles = useProgress((s) => s.solvedPuzzles);
  const miniObjectives = useProgress((s) => s.miniObjectives);
  const active = MINI_OBJECTIVES.find((m) => m.region === region && !solvedPuzzles.includes(m.reward.puzzleId) && !miniObjectives.includes(m.id));
  if (!active) return null;
  return (
    <group>
      {active.steps.map((step, i) => (
        <EmissiveMarker
          key={i}
          pos={step.position}
          emissive={active.region === 'lake' ? '#39d7ff' : active.region === 'ruins' ? '#5fd4e8' : '#4fe3c1'}
          intensity={2.4}
          geometry={active.region === 'lake' ? 'octahedron' : active.region === 'ruins' ? 'box' : 'icosahedron'}
          y={0.5}
        />
      ))}
    </group>
  );
}

/** Environmental storytelling interactables (repeatable, region-activated). */
export function Interactables() {
  const region = useLiveRegion((s) => s.region);
  const entries = INTERACTABLES.filter((e) => region === e.region);
  if (!entries.length) return null;
  return (
    <group>
      {entries.map((e) => (
        <EmissiveMarker
          key={e.id}
          pos={e.position}
          emissive="#d8bb78"
          intensity={2.2}
          color="#4a4034"
          geometry="box"
          y={0.75}
          lightColor="#ffce7d"
          lightIntensity={3}
          lightDistance={4.5}
        />
      ))}
    </group>
  );
}

/** Subtle markers for undiscovered secrets (region-activated). */
export function Secrets() {
  const region = useLiveRegion((s) => s.region);
  const secrets = useProgress((s) => s.secrets);
  const entries = SECRETS.filter((e) => region === e.region && !secrets.includes(e.id));
  if (!entries.length) return null;
  return (
    <group>
      {entries.map((e) => (
        <EmissiveMarker
          key={e.id}
          pos={e.position}
          emissive="#b9a4ff"
          intensity={2.0}
          color="#2a2440"
          geometry="icosahedron"
          y={0.4}
          lightIntensity={2.5}
          lightDistance={4}
        />
      ))}
    </group>
  );
}

/** Glowing crystals for uncollected lore fragments (region-activated). */
export function LoreFragments() {
  const region = useLiveRegion((s) => s.region);
  const lore = useProgress((s) => s.lore);
  const entries = LORE_FRAGMENTS.filter((e) => region === e.region && !lore.includes(e.id));
  if (!entries.length) return null;
  return (
    <group>
      {entries.map((e) => (
        <EmissiveMarker
          key={e.id}
          pos={e.position}
          emissive="#7df0d4"
          intensity={2.6}
          geometry="octahedron"
          y={1.1}
          lightIntensity={3}
          lightDistance={5}
        />
      ))}
    </group>
  );
}
