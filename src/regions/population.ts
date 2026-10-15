/** Authored population data: NPCs + wildlife + insect fields.
 *  Deterministic — no RNG. Same convention as villageLayout.ts. */

export type RegionId = 'village' | 'market' | 'lake' | 'grove' | 'clearing' | 'ruins' | 'tree';

export interface PopulationAnimation {
  /** Clip name for separate-clip models (Quaternius / KayKit Rig_Medium). */
  clip?: string;
  /** Baked-timeline range (Gobkit-style): seconds into the single embedded clip. */
  start?: number;
  end?: number;
  /** Playback rate (default 1). */
  speed?: number;
}

export interface PopulationWander {
  /** Max horizontal distance from authored position (u). */
  radius: number;
  /** Max horizontal speed (u/s). */
  speed: number;
}

export interface PopulationEntry {
  id: string;
  model: string;
  region: RegionId;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  animation?: PopulationAnimation;
  wander?: PopulationWander;
  interactable?: boolean;
  dialogue?: string[];
  label?: string;
  targetHeight?: number;
  /** When set, the entry only renders when the player is within this distance (u) of the entry's own position. Overrides the region gate. */
  visibleRadius?: number;
}

export interface InsectField {
  id: string;
  region: RegionId;
  center: [number, number, number];
  radius: number;
  count: number;
  color: string;
  bob?: { amp: number; speed: number };
}

export const POPULATION: PopulationEntry[] = [
  // ---- Village ----
  {
    id: 'villager',
    model: '/models/characters/Medieval.gltf',
    region: 'village',
    position: [4, 0, 2],
    targetHeight: 2.2,
    animation: { clip: 'Idle' },
    interactable: true,
    label: 'pop.villager',
    dialogue: [
      'pop.villager.0',
      'pop.villager.1',
    ],
  },
  {
    id: 'merchant',
    model: '/models/characters/Farmer.gltf',
    region: 'village',
    position: [8, 0, -3],
    targetHeight: 2.2,
    animation: { clip: 'Idle' },
    interactable: true,
    label: 'pop.merchant',
    dialogue: [
      'pop.merchant.0',
      'pop.merchant.1',
    ],
  },
  {
    id: 'fox',
    model: '/models/wildlife/Fox.gltf',
    region: 'village',
    position: [12, 0, -6],
    targetHeight: 0.6,
    animation: { clip: 'Idle' },
    wander: { radius: 3, speed: 0.5 },
  },
  // ---- Market ----
  {
    id: 'vendor',
    model: '/models/characters/Worker.gltf',
    region: 'market',
    position: [10, 0, -4],
    targetHeight: 2.2,
    animation: { clip: 'Idle' },
    interactable: true,
    label: 'pop.vendor',
    dialogue: [
      'pop.vendor.0',
      'pop.vendor.1',
    ],
  },
  // ---- Lake ----
  {
    id: 'fisherman',
    model: '/models/characters/Adventurer.gltf',
    region: 'lake',
    position: [-24, 0, 4],
    targetHeight: 2.2,
    animation: { clip: 'Idle' },
    interactable: true,
    label: 'pop.fisherman',
    dialogue: [
      'pop.fisherman.0',
      'pop.fisherman.1',
    ],
  },
  {
    id: 'duck1',
    model: '/models/wildlife/Duck.glb',
    region: 'lake',
    position: [-27, 0, 5],
    targetHeight: 0.3,
    animation: { start: 0, end: 1.2 },
  },
  {
    id: 'duck2',
    model: '/models/wildlife/Duck.glb',
    region: 'lake',
    position: [-26, 0, 7],
    targetHeight: 0.3,
    animation: { start: 0, end: 1.2 },
  },
  // ---- Grove ----
  {
    id: 'deer',
    model: '/models/wildlife/Deer.gltf',
    region: 'grove',
    position: [26, 0, -20],
    targetHeight: 1.5,
    animation: { clip: 'Idle_Headlow' },
    wander: { radius: 4, speed: 0.4 },
  },
  {
    id: 'stag',
    model: '/models/wildlife/Stag.gltf',
    region: 'grove',
    position: [30, 0, -24],
    targetHeight: 1.8,
    animation: { clip: 'Idle' },
  },
  {
    id: 'fox2',
    model: '/models/wildlife/Fox.gltf',
    region: 'grove',
    position: [25, 0, -25],
    targetHeight: 0.6,
    animation: { clip: 'Idle' },
    wander: { radius: 3, speed: 0.5 },
  },
  // ---- Spirit Clearing ----
  {
    id: 'deer2',
    model: '/models/wildlife/Deer.gltf',
    region: 'clearing',
    position: [4, 0, 4],
    targetHeight: 1.5,
    animation: { clip: 'Idle' },
    visibleRadius: 4,
  },
  // ---- Ruins ----
  {
    id: 'scholar',
    model: '/models/characters/Adventurer.gltf',
    region: 'ruins',
    position: [29, 0, 3],
    targetHeight: 2.2,
    animation: { clip: 'Idle' },
    interactable: true,
    label: 'pop.scholar',
    dialogue: [
      'pop.scholar.0',
      'pop.scholar.1',
    ],
  },
  {
    id: 'bat1',
    model: '/models/wildlife/Bat.glb',
    region: 'ruins',
    position: [32, 2, 4],
    targetHeight: 0.3,
    animation: { start: 0, end: 1.2 },
  },
  {
    id: 'bat2',
    model: '/models/wildlife/Bat.glb',
    region: 'ruins',
    position: [30, 2.5, 6],
    targetHeight: 0.3,
    animation: { start: 0, end: 1.2 },
  },
];

export const INSECTS: InsectField[] = [
  {
    id: 'grove_butterflies',
    region: 'grove',
    center: [28, 1, -22],
    radius: 6,
    count: 12,
    color: '#a8e6a3',
    bob: { amp: 0.3, speed: 1.5 },
  },
  {
    id: 'clearing_butterflies',
    region: 'clearing',
    center: [2, 1, 2],
    radius: 4,
    count: 8,
    color: '#c8b8ff',
    bob: { amp: 0.2, speed: 1.2 },
  },
];
