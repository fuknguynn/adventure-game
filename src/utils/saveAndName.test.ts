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
