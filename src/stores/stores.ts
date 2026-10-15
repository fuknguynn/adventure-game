import { create } from 'zustand';

interface Profile { displayName: string; characterId: string; setProfile: (p: Partial<Profile>) => void; }
export const useProfile = create<Profile>((set) => ({
  displayName: '',
  characterId: '',
  setProfile: (p) => set(p),
}));

export interface Progress {
  regionId: string; spawnId: string; completedQuests: string[]; solvedPuzzles: string[];
  spiritFragments: number; worldRestored: boolean;
  miniObjectives: string[]; secrets: string[]; lore: string[]; npcDialogueStage: number;
  setProgress: (p: Partial<Progress>) => void;
  solvePuzzle: (id: string) => void;
  completeMiniObjective: (id: string) => void;
  discoverSecret: (id: string) => void;
  collectLore: (id: string) => void;
  setNpcDialogueStage: (n: number) => void;
}
export const useProgress = create<Progress>((set) => ({
  regionId: 'forest_village', spawnId: 'village_entrance',
  completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false,
  miniObjectives: [], secrets: [], lore: [], npcDialogueStage: 0,
  setProgress: (p) => set(p),
  solvePuzzle: (id) => set((s) => {
    if (s.solvedPuzzles.includes(id)) return s;
    const solvedPuzzles = [...s.solvedPuzzles, id];
    const spiritFragments = Math.min(3, s.spiritFragments + 1);
    const worldRestored = solvedPuzzles.length >= 3;
    return { solvedPuzzles, spiritFragments, worldRestored };
  }),
  completeMiniObjective: (id) => set((s) => s.miniObjectives.includes(id) ? s : { miniObjectives: [...s.miniObjectives, id] }),
  discoverSecret: (id) => set((s) => s.secrets.includes(id) ? s : { secrets: [...s.secrets, id] }),
  collectLore: (id) => set((s) => s.lore.includes(id) ? s : { lore: [...s.lore, id] }),
  setNpcDialogueStage: (n) => set({ npcDialogueStage: n }),
}));

interface Settings {
  quality: 'auto' | 'low' | 'medium' | 'high';
  musicVolume: number; sfxVolume: number; reducedMotion: boolean; muted: boolean;
  lang: 'vi' | 'en';
  setSettings: (s: Partial<Settings>) => void;
}
export const useSettings = create<Settings>((set) => ({
  quality: 'auto', musicVolume: 0.5, sfxVolume: 0.7, reducedMotion: false, muted: false, lang: 'vi',
  setSettings: (s) => set(s),
}));
