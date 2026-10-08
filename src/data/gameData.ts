export interface CharacterDef {
  id: string;
  file: string;
  name: string;
  title: string;
  description: string;
}

/** Verified real GLBs in public/models/characters (see asset-manifest.json). Cosmetic only. */
export const CHARACTERS: CharacterDef[] = [
  { id: 'knight', file: '/models/characters/Knight.glb', name: 'Knight of the Grove', title: 'Warden', description: 'A steadfast warden sworn to the Ancient Tree. Cosmetic choice — same journey for all.' },
  { id: 'mage', file: '/models/characters/Mage.glb', name: 'Moss Mage', title: 'Keeper', description: 'A gentle keeper of mosslight and spores. Cosmetic choice — same journey for all.' },
  { id: 'rogue', file: '/models/characters/Rogue.glb', name: 'Thorn Rogue', title: 'Pathfinder', description: 'A quick pathfinder of briar trails. Cosmetic choice — same journey for all.' },
];

export const QUEST_MAIN = {
  id: 'the_forest_remembers',
  title: 'The Forest Remembers',
  steps: [
    'Speak with the forest spirit in the Village',
    'Recover the Grove Fragment (Mushroom Grove — Spirit Path)',
    'Recover the Lake Fragment (Crystal Lake — Rune Sequence)',
    'Recover the Ruins Fragment (Whispering Ruins — Light Reflection)',
    'Restore the Ancient Tree',
  ],
};

export const PUZZLES = {
  spiritPath: { id: 'spirit_path', target: [0, 2, 1, 3], hint: 'Follow the spirit footprints: stone order glows twice, then try.' },
  runeSequence: { id: 'rune_sequence', target: [1, 3, 0, 2], hint: 'Listen and watch: the runes sing in order. Replay any time.' },
  lightReflection: { id: 'light_reflection', targets: [1, 2, 0], hint: 'Turn each crystal until its beam runs straight to the gate.' },
};
