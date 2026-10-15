import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerPos } from '../game/Player';
import { regionAt } from '../systems/AudioSystem';
import { useProgress } from '../stores/stores';

type Mode = 'idle' | 'follow' | 'guide' | 'celebrate';

interface SpiritFSM {
  hint: boolean;        // hint mode active: lerp toward hintTarget + glow pulse
  dwell: number;        // seconds in the current region (30s hint gate)
  hintDwell: number;    // seconds hint has been active (10s re-arm gate)
  reactTimer: number;   // > 0 while the region-entry hop+flash plays
  lastRegion: string;
}

export function Spirit({ guideTarget, hintTarget = null, hintDone = false, celebratePulse = 0, worldLevel = 0 }: {
  guideTarget: THREE.Vector3 | null;
  /** Position of the next uncompleted mini-objective step, or null. */
  hintTarget?: THREE.Vector3 | null;
  /** True when the hinted objective is complete — exits hint mode. */
  hintDone?: boolean;
  /** Timestamp (clock time) of the last puzzle solve — triggers a 2s pulse. */
  celebratePulse?: number;
  /** 0-3, fragment count — scales glow/light. */
  worldLevel?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const fsm = useRef<SpiritFSM>({ hint: false, dwell: 0, hintDwell: 0, reactTimer: 0, lastRegion: '' });
  const pulseStart = useRef(0);
  // First-entry 'react' is session-scoped: re-entering a region does not re-hop.
  const visited = useRef(new Set<string>());
  const { solvedPuzzles, worldRestored } = useProgress();
  const mode: Mode = worldRestored ? 'celebrate' : guideTarget ? 'guide' : solvedPuzzles.length > 0 ? 'follow' : 'idle';

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const f = fsm.current;

    // 2s post-solve pulse: a one-shot re-trigger, not React state.
    if (celebratePulse > pulseStart.current) pulseStart.current = celebratePulse;
    const pulsing = t - pulseStart.current < 2;

    // Region tracking: 'react' hop on first entry to a region (session-scoped);
    // dwell timer drives the 30s hint gate.
    const region = regionAt(playerPos.x, playerPos.z);
    if (region !== f.lastRegion) {
      f.lastRegion = region;
      f.dwell = 0;
      if (!visited.current.has(region)) {
        visited.current.add(region);
        f.reactTimer = 2;
      }
    }
    if (f.reactTimer > 0) f.reactTimer -= delta;

    // Hint: fires after 30s region dwell while a mini-objective step exists
    // (hintTarget non-null) and the objective is unfinished; exits when the
    // objective completes, the target vanishes, or after a 10s re-arm timeout
    // (dwell resets so it can re-trigger).
    if (f.hint) {
      f.hintDwell += delta;
      if (hintDone || !hintTarget || f.hintDwell > 10) {
        f.hint = false;
        f.hintDwell = 0;
        f.dwell = 0;
      }
    } else {
      f.dwell += delta;
      if (f.dwell > 30 && hintTarget && !hintDone) {
        f.hint = true;
        f.hintDwell = 0;
      }
    }

    const celebrate = mode === 'celebrate' || pulsing;
    let anchor: THREE.Vector3;
    let want: THREE.Vector3;
    if (f.hint && hintTarget) {
      anchor = hintTarget;
      const ox = Math.sin(t * 1.4) * 0.5;
      const oz = Math.cos(t * 1.1) * 0.5 - 1.2; // approach from the player's side
      const oy = 2.1 + Math.sin(t * 2) * 0.25;
      want = new THREE.Vector3(anchor.x + ox, anchor.y + oy - 1, anchor.z + oz);
    } else {
      anchor = mode === 'guide' && guideTarget ? guideTarget : playerPos;
      const ox = mode === 'idle' ? Math.sin(t * 0.8) * 1.6 : Math.sin(t * 1.4) * 0.5;
      const oz = mode === 'idle' ? Math.cos(t * 0.6) * 1.6 : Math.cos(t * 1.1) * 0.5 + 1.2;
      const oy = 2.1 + Math.sin(t * (celebrate ? 4 : 2)) * (celebrate ? 0.5 : 0.25);
      want = new THREE.Vector3(anchor.x + ox, anchor.y + oy - 1, anchor.z + oz);
    }
    // First-entry 'react': single hop arc, additive over the base position.
    if (f.reactTimer > 0) want.y += 0.5 * Math.sin((f.reactTimer / 2) * Math.PI);
    g.position.lerp(want, 1 - Math.exp(-3 * 0.033));

    if (glow.current) {
      const s = celebrate ? 1.5 + Math.sin(t * 5) * 0.25 : 1 + Math.sin(t * 2.4) * 0.12;
      glow.current.scale.setScalar(s);
      const mat = glow.current.material as THREE.MeshStandardMaterial;
      // Base 2.2 + worldLevel bump; hint pulses 2.2->3.5; react flashes 3.0.
      const base = 2.2 + worldLevel * 0.4;
      mat.emissiveIntensity = f.hint ? base + Math.sin(t * 4) * 0.65 + 0.65
        : f.reactTimer > 0 ? 3.0
        : base + (celebrate ? 1.2 : 0);
    }
    if (light.current) light.current.intensity = 6 + worldLevel * 2 + (f.reactTimer > 0 || celebrate ? 4 : 0);
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
      <pointLight ref={light} color="#7df0d4" intensity={6} distance={9} decay={2} />
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
    </group>
  );
}
