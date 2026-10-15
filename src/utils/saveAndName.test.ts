import { describe, it, expect } from 'vitest';
import { isValidDisplayName } from './validateName';
import { SAVE_KEY, defaultSave, isValidSave, migrateSave } from './saveSchema';
import { loadSave, writeSave } from '../systems/SaveSystem';

function stubStorage() {
  const m = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe('display name validation', () => {
  it('rejects blank names', () => {
    expect(isValidDisplayName('')).toBe(false);
    expect(isValidDisplayName('   ')).toBe(false);
  });
  it('rejects overlong names', () => {
    expect(isValidDisplayName('a'.repeat(21))).toBe(false);
    expect(isValidDisplayName('a'.repeat(20))).toBe(true);
  });
  it('rejects control characters', () => {
    expect(isValidDisplayName('Ray\u0007')).toBe(false);
  });
  it('accepts unicode letters', () => {
    expect(isValidDisplayName('Zoë')).toBe(true);
    expect(isValidDisplayName('Östen-Å')).toBe(true);
  });
  it('accepts single char minimum', () => {
    expect(isValidDisplayName('R')).toBe(true);
  });
});

describe('save schema', () => {
  it('round-trips a default save', () => {
    expect(isValidSave(defaultSave())).toBe(true);
  });
  it('rejects garbage', () => {
    expect(isValidSave(null)).toBe(false);
    expect(isValidSave({})).toBe(false);
    expect(isValidSave({ schemaVersion: 99 })).toBe(false);
  });
  it('migrates legacy-ish saves and clamps fragments', () => {
    const m = migrateSave({ profile: { displayName: 'Ray', characterId: 'knight' }, progress: { spiritFragments: 9, solvedPuzzles: ['a'], completedQuests: [], worldRestored: false } });
    expect(m).not.toBe(null);
    expect(m!.progress.spiritFragments).toBe(3);
  });
  it('returns null for unrecoverable input', () => {
    expect(migrateSave(42)).toBe(null);
  });
  it('persists settings.muted through the full write→read path', () => {
    stubStorage();
    const d = defaultSave();
    d.settings.muted = true;
    writeSave(d);
    expect(loadSave()?.settings.muted).toBe(true);
  });
  it('migrates legacy saves without muted to muted=false (no version bump)', () => {
    stubStorage();
    // A save written before `muted` existed: still schemaVersion 1, settings
    // missing the key — must stay valid and gain muted:false on load.
    const legacy = { ...defaultSave(), settings: { quality: 'high', musicVolume: 0.4, sfxVolume: 0.6, reducedMotion: true } };
    localStorage.setItem(SAVE_KEY, JSON.stringify(legacy));
    const loaded = loadSave();
    expect(loaded).not.toBe(null);
    expect(loaded!.settings.muted).toBe(false);
    expect(loaded!.settings.quality).toBe('high');
    // persisted copy is normalized too
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).settings.muted).toBe(false);
  });
});

describe('save schema v2 migration', () => {
  it('migrates a v1 save to v2 with correct defaults', () => {
    const v1 = {
      schemaVersion: 1,
      profile: { displayName: 'Ray', characterId: 'knight' },
      progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: ['grove'], spiritFragments: 1, worldRestored: false },
      settings: { quality: 'auto', musicVolume: 0.5, sfxVolume: 0.7, reducedMotion: false, muted: false },
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const m = migrateSave(v1);
    expect(m).not.toBe(null);
    expect(m!.schemaVersion).toBe(3);
    expect(m!.progress.miniObjectives).toEqual([]);
    expect(m!.progress.secrets).toEqual([]);
    expect(m!.progress.lore).toEqual([]);
    expect(m!.progress.npcDialogueStage).toBe(1);
    expect(m!.settings.lang).toBe('vi');
  });

  it('fills settings.lang=vi for v2 saves missing lang', () => {
    const v2 = {
      schemaVersion: 2,
      profile: { displayName: 'Ray', characterId: 'knight' },
      progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false, miniObjectives: [], secrets: [], lore: [], npcDialogueStage: 0 },
      settings: { quality: 'auto', musicVolume: 0.5, sfxVolume: 0.7, reducedMotion: false, muted: false },
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const m = migrateSave(v2);
    expect(m).not.toBe(null);
    expect(m!.schemaVersion).toBe(3);
    expect(m!.settings.lang).toBe('vi');
  });

  it('keeps an explicit v3 lang', () => {
    const v3 = { ...defaultSave(), settings: { quality: 'auto' as const, musicVolume: 0.5, sfxVolume: 0.7, reducedMotion: false, muted: false, lang: 'en' as const } };
    const m = migrateSave(v3);
    expect(m).not.toBe(null);
    expect(m!.settings.lang).toBe('en');
  });

  it('derives npcDialogueStage=4 for worldRestored v1 saves', () => {
    const v1 = {
      schemaVersion: 1,
      profile: { displayName: 'Ray', characterId: 'knight' },
      progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: ['grove', 'lake', 'ruins'], spiritFragments: 3, worldRestored: true },
      settings: { quality: 'auto', musicVolume: 0.5, sfxVolume: 0.7, reducedMotion: false, muted: false },
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const m = migrateSave(v1);
    expect(m).not.toBe(null);
    expect(m!.progress.npcDialogueStage).toBe(4);
  });

  it('isValidSave accepts v1, v2 and v3', () => {
    const v1 = {
      schemaVersion: 1,
      profile: { displayName: 'Ray', characterId: 'knight' },
      progress: { regionId: 'forest_village', spawnId: 'village_entrance', completedQuests: [], solvedPuzzles: [], spiritFragments: 0, worldRestored: false },
      settings: { quality: 'auto', musicVolume: 0.5, sfxVolume: 0.7, reducedMotion: false, muted: false },
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const v2 = { ...v1, schemaVersion: 2, progress: { ...v1.progress, miniObjectives: [], secrets: [], lore: [], npcDialogueStage: 0 } };
    const v3 = { ...v2, schemaVersion: 3, settings: { ...v2.settings, lang: 'en' } };
    expect(isValidSave(v1)).toBe(true);
    expect(isValidSave(v2)).toBe(true);
    expect(isValidSave(v3)).toBe(true);
  });

  it('v2 save round-trips through write→read', () => {
    stubStorage();
    const d = defaultSave();
    d.progress.miniObjectives = ['grove_trail'];
    d.progress.secrets = ['secret_1'];
    d.progress.lore = ['lore_1'];
    d.progress.npcDialogueStage = 2;
    writeSave(d);
    const loaded = loadSave();
    expect(loaded).not.toBe(null);
    expect(loaded!.schemaVersion).toBe(3);
    expect(loaded!.progress.miniObjectives).toEqual(['grove_trail']);
    expect(loaded!.progress.secrets).toEqual(['secret_1']);
    expect(loaded!.progress.lore).toEqual(['lore_1']);
    expect(loaded!.progress.npcDialogueStage).toBe(2);
  });
});
