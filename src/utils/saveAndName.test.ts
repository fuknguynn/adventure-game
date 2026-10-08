import { describe, it, expect } from 'vitest';
import { isValidDisplayName } from './validateName';
import { defaultSave, isValidSave, migrateSave } from './saveSchema';

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
});
