import { SAVE_KEY, SaveData, defaultSave, isValidSave, migrateSave } from '../utils/saveSchema';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isValidSave(parsed)) return parsed;
    const migrated = migrateSave(parsed);
    if (migrated) {
      writeSave(migrated);
      return migrated;
    }
    // corrupted beyond repair → quarantine, return null (caller shows Welcome)
    localStorage.removeItem(SAVE_KEY);
    localStorage.setItem(`${SAVE_KEY}.corrupt.${Date.now()}`, raw.slice(0, 2000));
    return null;
  } catch {
    return null;
  }
}

export function writeSave(d: SaveData): void {
  try {
    d.updatedAt = new Date().toISOString();
    localStorage.setItem(SAVE_KEY, JSON.stringify(d));
  } catch {
    /* storage full/blocked: game continues in-memory */
  }
}

export function resetSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function collectSave(profile: SaveData['profile'], progress: SaveData['progress'], settings: SaveData['settings']): SaveData {
  const d = defaultSave();
  d.profile = profile;
  d.progress = progress;
  d.settings = settings;
  return d;
}
