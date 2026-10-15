// User-facing strings are emitted as i18n translation keys (see src/i18n/locales/data.*.ts).
export interface CharacterDef {
  id: string;
  file: string;
  name: string;
  title: string;
  description: string;
}

/** Verified real GLBs in public/models/characters (see asset-manifest.json). Cosmetic only. */
export const CHARACTERS: CharacterDef[] = [
  { id: 'knight', file: '/models/characters/Knight.glb', name: 'char.name.knight', title: 'char.title.knight', description: 'char.desc.knight' },
  { id: 'mage', file: '/models/characters/Mage.glb', name: 'char.name.mage', title: 'char.title.mage', description: 'char.desc.mage' },
  { id: 'rogue', file: '/models/characters/Rogue.glb', name: 'char.name.rogue', title: 'char.title.rogue', description: 'char.desc.rogue' },
];

export const QUEST_MAIN = {
  id: 'the_forest_remembers',
  title: 'quest.main.title',
  steps: [
    'quest.main.step.0',
    'quest.main.step.1',
    'quest.main.step.2',
    'quest.main.step.3',
    'quest.main.step.4',
  ],
};

export const PUZZLES = {
  spiritPath: { id: 'spirit_path', target: [0, 2, 1, 3], hint: 'puzzle.hint.spirit_path' },
  runeSequence: { id: 'rune_sequence', target: [1, 3, 0, 2], hint: 'puzzle.hint.rune_sequence' },
  lightReflection: { id: 'light_reflection', targets: [1, 2, 0], hint: 'puzzle.hint.light_reflection' },
};
