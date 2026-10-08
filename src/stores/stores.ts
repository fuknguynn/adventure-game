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
  setProgress: (p: Partial<Progress>) => void;
  solvePuzzle: (id: string) => void;
}
export const useProgress = create<Progress>((set) => ({
  regionId: 'forest_village', spawnId: 'village_entrance',
  completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false,
  setProgress: (p) => set(p),
  solvePuzzle: (id) => set((s) => {
    if (s.solvedPuzzles.includes(id)) return s;
    const solvedPuzzles = [...s.solvedPuzzles, id];
    const spiritFragments = Math.min(3, s.spiritFragments + 1);
    const worldRestored = solvedPuzzles.length >= 3;
    return { solvedPuzzles, spiritFragments, worldRestored };
  }),
}));

interface Settings {
  quality: 'auto' | 'low' | 'medium' | 'high';
  musicVolume: number; sfxVolume: number; reducedMotion: boolean; muted: boolean;
  setSettings: (s: Partial<Settings>) => void;
}
export const useSettings = create<Settings>((set) => ({
  quality: 'auto', musicVolume: 0.5, sfxVolume: 0.7, reducedMotion: false, muted: false,
  setSettings: (s) => set(s),
}));
