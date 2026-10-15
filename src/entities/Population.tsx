import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { POPULATION, INSECTS, type RegionId } from '../regions/population';
import { PopulationModel } from './PopulationModel';
import { InsectPoints } from './InsectPoints';
import { playerPos } from '../game/Player';
import { regionAt } from '../systems/AudioSystem';

/** Map a population region id to the id `regionAt` returns.
 *  'clearing' is the Spirit Clearing (regionAt: 'spirit'); 'market' is part of
 *  the village zone (regionAt: 'village'); everything else maps to itself. */
const REGION_MAP: Record<RegionId, string> = {
  village: 'village',
  market: 'village',
  lake: 'lake',
  grove: 'grove',
  clearing: 'spirit',
  ruins: 'ruins',
  tree: 'tree',
};

/** Renders children only while the player is in (or near) `region`.
 *  If `visibleRadius` + `position` are given, gates on distance to that
 *  position instead (per-entry override — the region gate is too coarse where
 *  regions overlap, e.g. the clearing at the village center).
 *  Tracks at ~2 Hz via a ref + useFrame accumulator; the single useState
 *  updates only when visibility actually CHANGES (rare, not per-frame). */
function RegionGate({ region, visibleRadius, position, children }: { region: string; visibleRadius?: number; position?: [number, number, number]; children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const acc = useRef(0);
  const target = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 0.5) return; // ~2 Hz
    acc.current = 0;
    const inRegion = visibleRadius !== undefined && position
      ? target.current.set(position[0], playerPos.y, position[2]).distanceTo(playerPos) < visibleRadius
      : regionAt(playerPos.x, playerPos.z) === region;
    setActive((prev) => (prev === inRegion ? prev : inRegion));
  });
  return active ? <>{children}</> : null;
}

/** All population: NPCs + wildlife (no colliders) + procedural insect fields.
 *  Rendered outside <Physics> — interaction is distance-based, not collider-based.
 *  Each entry is gated: per-entry visibleRadius when set, else its region. */
export function Population() {
  return (
    <group>
      {POPULATION.map((e) => (
        <RegionGate key={e.id} region={REGION_MAP[e.region]} visibleRadius={e.visibleRadius} position={e.position}>
          <PopulationModel entry={e} />
        </RegionGate>
      ))}
      {INSECTS.map((f) => (
        <RegionGate key={f.id} region={REGION_MAP[f.region]}>
          <InsectPoints field={f} />
        </RegionGate>
      ))}
    </group>
  );
}
