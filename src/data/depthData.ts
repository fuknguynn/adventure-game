// depthData.ts — authored content for the Gameplay Depth Production Pass.
// Pure data module; no imports from stores or game code.

// ---- Main NPC (Elder Mira) dialogue, 5 stages (index = npcDialogueStage) ----
export const MAIN_NPC_DIALOGUE: string[][] = [
  // Stage 0: first meeting
  [
    'The forest is weakening, child. Three Spirit Fragments are lost.',
    'The Ancient Tree cannot recover without them.',
    'Follow the Spirit — it will guide you to the first.',
  ],
  // Stage 1: after 1 fragment
  [
    'You found one. The Spirit grows brighter with each fragment.',
    'The next lies where the water glows — Crystal Lake holds its secret.',
  ],
  // Stage 2: after 2 fragments
  [
    'Two down. The Tree stirs, but the last fragment is hidden deep.',
    'The old ruins whisper of it — the runes will show you the way.',
  ],
  // Stage 3: after 3 fragments
  [
    'All three fragments are yours. The forest holds its breath.',
    'Take them to the Ancient Tree. It is time.',
  ],
  // Stage 4: after ending
  [
    'The Tree breathes again. The forest remembers what you did.',
    'You are part of its story now, child.',
  ],
];

// ---- Secondary NPC dialogue, keyed by population entry id ----
export const NPC_DIALOGUE: Record<string, string[][]> = {
  merchant: [
    ['The forest has been quiet lately. Too quiet.', 'Folks say the old light is fading.'],
    ['I heard the grove mushrooms glow brighter last night. Something is stirring near the Grove.'],
  ],
  fisherman: [
    ['The crystals under the lake hum when the wind is right.', 'Old folk say they remember the first keeper.'],
    ['The water near the shore glows at night now. Never seen that before.'],
  ],
  scholar: [
    ['The ruins predate the village by centuries. The runes are a language I cannot fully read.', 'But the sequence — I think it follows the stars.'],
    ['Each rune in the ruins corresponds to a direction. The order matters.'],
  ],
  villager: [
    ['My grandmother used to tell stories about the Tree. She said it dreamed.'],
    ['The spirit light follows you, doesn\'t it? Don\'t worry — it means well.'],
  ],
};

// ---- Region entry titles ----
export const REGION_TITLES: Record<string, string> = {
  village: 'Forest Village',
  spirit: 'Spirit Clearing',
  lake: 'Crystal Lake',
  grove: 'Mushroom Grove',
  ruins: 'Whispering Ruins',
  tree: 'The Ancient Tree',
};

// ---- Current objective text based on progress ----
export function currentObjective(solvedPuzzles: string[], miniObjectives: string[]): string {
  if (solvedPuzzles.length >= 3) return 'Return the Spirit Fragments to the Ancient Tree';
  if (solvedPuzzles.length === 2) return 'Search the Ruins for rune clues';
  if (solvedPuzzles.length === 1) return 'Investigate the Crystal Lake';
  if (miniObjectives.includes('grove_trail')) return 'Follow the Spirit into the Grove';
  return 'Speak with the Forest Keeper';
}

// ---- Mini-objectives (one per puzzle region; 3 steps each) ----
export interface MiniObjectiveStep {
  type: 'marker' | 'clue' | 'inspect';
  position: [number, number, number];
  label: string;
  check: { radius: number };
}
export interface MiniObjective {
  id: string;
  region: string;
  title: string;
  steps: MiniObjectiveStep[];
  reward: { puzzleId: string; toast: string };
}
export const MINI_OBJECTIVES: MiniObjective[] = [
  {
    id: 'grove_trail',
    region: 'grove',
    title: 'Follow the Spirit Trail',
    steps: [
      { type: 'marker', position: [24, 0, -18], label: 'Glowing moss stone', check: { radius: 3 } },
      { type: 'marker', position: [26, 0, -20], label: 'Glowing moss stone', check: { radius: 3 } },
      { type: 'marker', position: [28, 0, -22], label: 'Glowing moss stone', check: { radius: 3 } },
    ],
    reward: { puzzleId: 'spirit_path', toast: 'The Spirit reveals the puzzle' },
  },
  {
    id: 'lake_crystals',
    region: 'lake',
    title: 'Find the Crystal Clues',
    steps: [
      { type: 'clue', position: [-26, 0, 4], label: 'Crystal clue', check: { radius: 3 } },
      { type: 'clue', position: [-28, 0, 6], label: 'Crystal clue', check: { radius: 3 } },
      { type: 'clue', position: [-30, 0, 8], label: 'Crystal clue', check: { radius: 3 } },
    ],
    reward: { puzzleId: 'rune_sequence', toast: 'The crystals reveal the sequence' },
  },
  {
    id: 'ruins_runes',
    region: 'ruins',
    title: 'Read the Rune Clues',
    steps: [
      { type: 'inspect', position: [29, 0, 3], label: 'Rune inscription', check: { radius: 3 } },
      { type: 'inspect', position: [31, 0, 5], label: 'Rune inscription', check: { radius: 3 } },
      { type: 'inspect', position: [33, 0, 7], label: 'Rune inscription', check: { radius: 3 } },
    ],
    reward: { puzzleId: 'light_reflection', toast: 'The runes show the reflection order' },
  },
];

// ---- Environmental storytelling interactables (repeatable flavor, ~2-3 per region) ----
export interface Interactable {
  id: string;
  region: string;
  position: [number, number, number];
  label: string;
  text: string[];
  model?: string;
}
export const INTERACTABLES: Interactable[] = [
  { id: 'village_sign', region: 'village', position: [2.8, 0, 12.5], label: 'Read the sign', text: ['The village has stood for a hundred years. The Tree keeps it safe.'] },
  { id: 'village_shrine', region: 'village', position: [-3.2, 0, 11], label: 'Examine the shrine', text: ['The shrine is cracked. The light that once filled it is gone.'] },
  { id: 'village_supplies', region: 'village', position: [7, 0, 11], label: 'Look at the supplies', text: ['Someone left these behind in a hurry.'] },
  { id: 'ruins_inscription', region: 'ruins', position: [27, 0, 1], label: 'Read the inscription', text: ['The old keepers carved their warnings here. Read carefully.'] },
  { id: 'ruins_monument', region: 'ruins', position: [33.5, 0, 2.5], label: 'Study the monument', text: ['The monument fell when the fragments were lost.'] },
  { id: 'ruins_markings', region: 'ruins', position: [27.5, 0, 8], label: 'Examine the markings', text: ['These markings predate the village by centuries.'] },
  { id: 'lake_crystal_formation', region: 'lake', position: [-25.5, 0, 9], label: 'Touch the formation', text: ['The crystals hum with a low, steady pulse.'] },
  { id: 'lake_camp', region: 'lake', position: [-32.5, 0, 3], label: 'Search the camp', text: ["A fisherman's camp, long abandoned. The lantern still glows."] },
  { id: 'grove_growth', region: 'grove', position: [30, 0, -19], label: 'Inspect the growth', text: ['The mushrooms glow brighter than they should. Something is stirring.'] },
  { id: 'grove_marks', region: 'grove', position: [23, 0, -16], label: 'Follow the marks', text: ['The Spirit left these marks. They point deeper into the grove.'] },
  { id: 'tree_stones', region: 'tree', position: [2, 0, 33], label: 'Touch the ritual stones', text: ['The stones are warm despite the cold air.'] },
  { id: 'tree_sockets', region: 'tree', position: [-3.5, 0, 28.5], label: 'Study the sockets', text: ['Three sockets, empty. The Tree waits for its fragments.'] },
];

// ---- Secrets (off-critical-path exploration rewards, 4 total) ----
export interface Secret {
  id: string;
  region: string;
  position: [number, number, number];
  trigger: { radius: number };
  reward: { kind: 'lore' | 'effect' | 'collectible' | 'flag'; id?: string; text: string };
  label: string;
}
export const SECRETS: Secret[] = [
  { id: 'secret_grove_glow', region: 'grove', position: [27, 0, -21], trigger: { radius: 2 }, reward: { kind: 'effect', text: 'The mushrooms pulse with light' }, label: 'Hidden Glow' },
  { id: 'secret_lake_depth', region: 'lake', position: [-29, 0, 7], trigger: { radius: 2 }, reward: { kind: 'lore', id: 'lake_origin', text: 'The lake was the first to remember.' }, label: 'Deep Memory' },
  { id: 'secret_ruins_chamber', region: 'ruins', position: [32, 0, 6], trigger: { radius: 2 }, reward: { kind: 'collectible', text: 'A small crystal shard' }, label: 'Hidden Chamber' },
  { id: 'secret_tree_heart', region: 'tree', position: [0, 0, 33], trigger: { radius: 2 }, reward: { kind: 'flag', text: "You touched the Tree's heart" }, label: 'The Heart' },
];

// ---- Lore fragments (6 total, persistent) ----
export interface LoreFragment {
  id: string;
  region: string;
  position: [number, number, number];
  title: string;
  text: string;
  category: 'tree' | 'keepers' | 'ruins' | 'spirit' | 'lake';
}
export const LORE_FRAGMENTS: LoreFragment[] = [
  { id: 'tree_origin', region: 'tree', position: [0, 0, 32], title: 'The First Tree', text: 'The Ancient Tree was the first to wake when the forest dreamed.', category: 'tree' },
  { id: 'keepers', region: 'ruins', position: [30, 0, 4], title: 'The Keepers', text: 'Three keepers guarded the fragments. Their names are carved in the ruins.', category: 'keepers' },
  { id: 'ruins_history', region: 'ruins', position: [29, 0, 3], title: 'The Old Ruins', text: 'The ruins were a sanctuary. The runes were a lock.', category: 'ruins' },
  { id: 'spirit_lore', region: 'spirit', position: [2, 0, 2], title: 'The Spirit', text: "The Spirit is the forest's memory, given light.", category: 'spirit' },
  { id: 'lake_origin', region: 'lake', position: [-28, 0, 6], title: 'Crystal Lake', text: 'The lake formed where the first fragment fell.', category: 'lake' },
  { id: 'grove_secret', region: 'grove', position: [28, 0, -22], title: 'The Grove', text: 'The mushrooms grow toward the light. They remember the Tree.', category: 'tree' },
];
