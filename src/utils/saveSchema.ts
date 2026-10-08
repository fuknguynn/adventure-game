export const SAVE_KEY = 'eldergrove.save.v1';
export const SCHEMA_VERSION = 1;

export interface SaveData {
  schemaVersion: number;
  profile: { displayName: string; characterId: string };
  progress: {
    regionId: string;
    spawnId: string;
    completedQuests: string[];
    solvedPuzzles: string[];
    spiritFragments: number;
    worldRestored: boolean;
  };
  settings: { quality: 'auto' | 'low' | 'medium' | 'high'; musicVolume: number; sfxVolume: number; reducedMotion: boolean };
  updatedAt: string;
}

export function defaultSave(): SaveData {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { displayName: '', characterId: '' },
    progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false },
    settings: { quality: 'auto', musicVolume: 0.5, sfxVolume: 0.7, reducedMotion: false },
    updatedAt: new Date().toISOString(),
  };
}

export function isValidSave(d: unknown): d is SaveData {
  if (!d || typeof d !== 'object') return false;
  const s = d as Record<string, unknown>;
  if (s.schemaVersion !== SCHEMA_VERSION) return false;
  const p = s.profile as Record<string, unknown> | undefined;
  const g = s.progress as Record<string, unknown> | undefined;
  const st = s.settings as Record<string, unknown> | undefined;
  return (
    !!p && typeof p.displayName === 'string' && typeof p.characterId === 'string' &&
    !!g && typeof g.regionId === 'string' && Array.isArray(g.completedQuests) &&
    Array.isArray(g.solvedPuzzles) && typeof g.spiritFragments === 'number' &&
    typeof g.worldRestored === 'boolean' && !!st
  );
}

/** Migrate older saves; returns null when unrecoverable. */
export function migrateSave(raw: unknown): SaveData | null {
  if (isValidSave(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const s = raw as Record<string, unknown>;
    if (s.schemaVersion === 0 || s.schemaVersion === undefined) {
      // best-effort: salvage profile/progress fields, fill defaults
      const d = defaultSave();
      try {
        const p = s.profile as { displayName?: unknown; characterId?: unknown } | undefined;
        if (p && typeof p.displayName === 'string') d.profile.displayName = p.displayName.slice(0, 20);
        if (p && typeof p.characterId === 'string') d.profile.characterId = p.characterId;
        const g = s.progress as Partial<SaveData['progress']> | undefined;
        if (g) {
          if (Array.isArray(g.solvedPuzzles)) d.progress.solvedPuzzles = g.solvedPuzzles.filter((x) => typeof x === 'string');
          if (Array.isArray(g.completedQuests)) d.progress.completedQuests = g.completedQuests.filter((x) => typeof x === 'string');
          if (typeof g.spiritFragments === 'number') d.progress.spiritFragments = Math.max(0, Math.min(3, Math.floor(g.spiritFragments)));
          if (typeof g.worldRestored === 'boolean') d.progress.worldRestored = g.worldRestored;
        }
        return d;
      } catch {
        return null;
      }
    }
  }
  return null;
}
