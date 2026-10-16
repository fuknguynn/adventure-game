// depthData.ts — authored content for the Gameplay Depth Production Pass.
// Pure data module; no imports from stores or game code.
// User-facing strings are emitted as i18n translation keys (see src/i18n/locales/data.*.ts).

// ---- Main NPC (Elder Mira) dialogue, 5 stages (index = npcDialogueStage) ----
export const MAIN_NPC_DIALOGUE: string[][] = [
  // Stage 0: first meeting
  [
    'npc.dialogue.mira.0.0',
    'npc.dialogue.mira.0.1',
    'npc.dialogue.mira.0.2',
  ],
  // Stage 1: after 1 fragment
  [
    'npc.dialogue.mira.1.0',
    'npc.dialogue.mira.1.1',
  ],
  // Stage 2: after 2 fragments
  [
    'npc.dialogue.mira.2.0',
    'npc.dialogue.mira.2.1',
  ],
  // Stage 3: after 3 fragments
  [
    'npc.dialogue.mira.3.0',
    'npc.dialogue.mira.3.1',
  ],
  // Stage 4: after ending
  [
    'npc.dialogue.mira.4.0',
    'npc.dialogue.mira.4.1',
  ],
];

// ---- Secondary NPC dialogue, keyed by population entry id ----
export const NPC_DIALOGUE: Record<string, string[][]> = {
  merchant: [
    ['npc.dialogue.merchant.0.0', 'npc.dialogue.merchant.0.1'],
    ['npc.dialogue.merchant.1.0'],
  ],
  fisherman: [
    ['npc.dialogue.fisherman.0.0', 'npc.dialogue.fisherman.0.1'],
    ['npc.dialogue.fisherman.1.0'],
  ],
  scholar: [
    ['npc.dialogue.scholar.0.0', 'npc.dialogue.scholar.0.1'],
    ['npc.dialogue.scholar.1.0'],
  ],
  villager: [
    ['npc.dialogue.villager.0.0'],
    ['npc.dialogue.villager.1.0'],
  ],
};

// ---- Region entry titles ----
export const REGION_TITLES: Record<string, string> = {
  village: 'region.village',
  spirit: 'region.spirit',
  lake: 'region.lake',
  grove: 'region.grove',
  ruins: 'region.ruins',
  tree: 'region.tree',
};

// ---- Current objective text based on progress ----
export function currentObjective(solvedPuzzles: string[], miniObjectives: string[], metSpirit: boolean): string {
  if (solvedPuzzles.length >= 3) return 'obj.return_fragments';
  if (solvedPuzzles.length === 2) return 'obj.search_ruins';
  if (solvedPuzzles.length === 1) return 'obj.investigate_lake';
  if (miniObjectives.includes('grove_trail')) return 'obj.grove_riddle';
  if (metSpirit) return 'obj.follow_spirit_grove';
  return 'obj.speak_keeper';
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
    title: 'obj.grove_trail',
    steps: [
      { type: 'marker', position: [24, 0, -18], label: 'obj.grove_trail.step', check: { radius: 3 } },
      { type: 'marker', position: [26, 0, -20], label: 'obj.grove_trail.step', check: { radius: 3 } },
      { type: 'marker', position: [28, 0, -22], label: 'obj.grove_trail.step', check: { radius: 3 } },
    ],
    reward: { puzzleId: 'spirit_path', toast: 'obj.grove_trail.toast' },
  },
  {
    id: 'lake_crystals',
    region: 'lake',
    title: 'obj.lake_crystals',
    steps: [
      { type: 'clue', position: [-26, 0, 4], label: 'obj.lake_crystals.step', check: { radius: 3 } },
      { type: 'clue', position: [-28, 0, 6], label: 'obj.lake_crystals.step', check: { radius: 3 } },
      { type: 'clue', position: [-30, 0, 8], label: 'obj.lake_crystals.step', check: { radius: 3 } },
    ],
    reward: { puzzleId: 'rune_sequence', toast: 'obj.lake_crystals.toast' },
  },
  {
    id: 'ruins_runes',
    region: 'ruins',
    title: 'obj.ruins_runes',
    steps: [
      { type: 'inspect', position: [29, 0, 3], label: 'obj.ruins_runes.step', check: { radius: 3 } },
      { type: 'inspect', position: [31, 0, 5], label: 'obj.ruins_runes.step', check: { radius: 3 } },
      { type: 'inspect', position: [33, 0, 7], label: 'obj.ruins_runes.step', check: { radius: 3 } },
    ],
    reward: { puzzleId: 'light_reflection', toast: 'obj.ruins_runes.toast' },
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
  { id: 'village_sign', region: 'village', position: [2.8, 0, 12.5], label: 'interact.village_sign.label', text: ['interact.village_sign.text'] },
  { id: 'village_shrine', region: 'village', position: [-3.2, 0, 11], label: 'interact.village_shrine.label', text: ['interact.village_shrine.text'] },
  { id: 'village_supplies', region: 'village', position: [7, 0, 11], label: 'interact.village_supplies.label', text: ['interact.village_supplies.text'] },
  { id: 'ruins_inscription', region: 'ruins', position: [27, 0, 1], label: 'interact.ruins_inscription.label', text: ['interact.ruins_inscription.text'] },
  { id: 'ruins_monument', region: 'ruins', position: [33.5, 0, 2.5], label: 'interact.ruins_monument.label', text: ['interact.ruins_monument.text'] },
  { id: 'ruins_markings', region: 'ruins', position: [27.5, 0, 8], label: 'interact.ruins_markings.label', text: ['interact.ruins_markings.text'] },
  { id: 'lake_crystal_formation', region: 'lake', position: [-25.5, 0, 9], label: 'interact.lake_crystal_formation.label', text: ['interact.lake_crystal_formation.text'] },
  { id: 'lake_camp', region: 'lake', position: [-32.5, 0, 3], label: 'interact.lake_camp.label', text: ['interact.lake_camp.text'] },
  { id: 'grove_growth', region: 'grove', position: [30, 0, -19], label: 'interact.grove_growth.label', text: ['interact.grove_growth.text'] },
  { id: 'grove_marks', region: 'grove', position: [23, 0, -16], label: 'interact.grove_marks.label', text: ['interact.grove_marks.text'] },
  { id: 'tree_stones', region: 'tree', position: [2, 0, 33], label: 'interact.tree_stones.label', text: ['interact.tree_stones.text'] },
  { id: 'tree_sockets', region: 'tree', position: [-3.5, 0, 28.5], label: 'interact.tree_sockets.label', text: ['interact.tree_sockets.text'] },
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
  { id: 'secret_grove_glow', region: 'grove', position: [27, 0, -21], trigger: { radius: 2 }, reward: { kind: 'effect', text: 'secret.secret_grove_glow.text' }, label: 'secret.secret_grove_glow.label' },
  { id: 'secret_lake_depth', region: 'lake', position: [-29, 0, 7], trigger: { radius: 2 }, reward: { kind: 'lore', id: 'lake_origin', text: 'secret.secret_lake_depth.text' }, label: 'secret.secret_lake_depth.label' },
  { id: 'secret_ruins_chamber', region: 'ruins', position: [32, 0, 6], trigger: { radius: 2 }, reward: { kind: 'collectible', text: 'secret.secret_ruins_chamber.text' }, label: 'secret.secret_ruins_chamber.label' },
  { id: 'secret_tree_heart', region: 'tree', position: [0, 0, 33], trigger: { radius: 2 }, reward: { kind: 'flag', text: 'secret.secret_tree_heart.text' }, label: 'secret.secret_tree_heart.label' },
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
  { id: 'tree_origin', region: 'tree', position: [0, 0, 32], title: 'lore.tree_origin.title', text: 'lore.tree_origin.text', category: 'tree' },
  { id: 'keepers', region: 'ruins', position: [30, 0, 4], title: 'lore.keepers.title', text: 'lore.keepers.text', category: 'keepers' },
  { id: 'ruins_history', region: 'ruins', position: [29, 0, 3], title: 'lore.ruins_history.title', text: 'lore.ruins_history.text', category: 'ruins' },
  { id: 'spirit_lore', region: 'spirit', position: [2, 0, 2], title: 'lore.spirit_lore.title', text: 'lore.spirit_lore.text', category: 'spirit' },
  { id: 'lake_origin', region: 'lake', position: [-28, 0, 6], title: 'lore.lake_origin.title', text: 'lore.lake_origin.text', category: 'lake' },
  { id: 'grove_secret', region: 'grove', position: [28, 0, -22], title: 'lore.grove_secret.title', text: 'lore.grove_secret.text', category: 'tree' },
];
