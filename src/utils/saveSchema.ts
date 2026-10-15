export const SAVE_KEY = 'eldergrove.save.v1';
export const SCHEMA_VERSION = 2;

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
    miniObjectives: string[];
    secrets: string[];
    lore: string[];
    npcDialogueStage: number;
  };
  settings: { quality: 'auto' | 'low' | 'medium' | 'high'; musicVolume: number; sfxVolume: number; reducedMotion: boolean; muted: boolean };
  updatedAt: string;
}

export function deriveStageFromProgress(p: { worldRestored: boolean; spiritFragments: number }): number {
  return p.worldRestored ? 4 : Math.min(3, p.spiritFragments);
}

export function defaultSave(): SaveData {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { displayName: '', characterId: '' },
    progress: {
      regionId: 'forest_village', spawnId: 'village_entrance',
      completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false,
      miniObjectives: [], secrets: [], lore: [], npcDialogueStage: 0,
    },
    settings: { quality: 'auto', musicVolume: 0.5, sfxVolume: 0.7, reducedMotion: false, muted: false },
    updatedAt: new Date().toISOString(),
  };
}

export function isValidSave(d: unknown): d is SaveData {
  if (!d || typeof d !== 'object') return false;
  const s = d as Record<string, unknown>;
  if (s.schemaVersion !== 1 && s.schemaVersion !== SCHEMA_VERSION) return false;
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
  if (isValidSave(raw)) {
    const s = raw as SaveData;
    // Normalize missing/invalid settings.muted to false
    if (typeof s.settings.muted !== 'boolean') s.settings.muted = false;
    // v1 → v2: fill new fields with defaults, bump version
    if (s.schemaVersion === 1) {
      s.schemaVersion = SCHEMA_VERSION;
      const p = s.progress as Record<string, unknown>;
      if (!Array.isArray(p.miniObjectives)) p.miniObjectives = [];
      if (!Array.isArray(p.secrets)) p.secrets = [];
      if (!Array.isArray(p.lore)) p.lore = [];
      if (typeof p.npcDialogueStage !== 'number') p.npcDialogueStage = deriveStageFromProgress(s.progress);
    }
    return s;
  }
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
        d.progress.npcDialogueStage = deriveStageFromProgress(d.progress);
        return d;
      } catch {
        return null;
      }
    }
  }
  return null;
}
