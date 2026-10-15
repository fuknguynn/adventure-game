// i18n core: flat key→string dictionaries per locale, vi default.
// Merges game-data keys (data.*) with UI keys (ui.*). UI keys override
// data keys on collision.
import { dataVi } from './locales/data.vi';
import { dataEn } from './locales/data.en';
import { uiVi } from './locales/ui.vi';
import { uiEn } from './locales/ui.en';
import { useI18n } from '../stores/i18nStore';
import type { Lang } from '../stores/i18nStore';

export type { Lang };
export { useI18n };
export { useT } from './useT';

const VI: Record<string, string> = { ...dataVi, ...uiVi };
const EN: Record<string, string> = { ...dataEn, ...uiEn };

/**
 * Translate a key. Missing in current lang → try en → return the key itself.
 * `{name}`-style placeholders are replaced from `vars`.
 * `lang` optional: defaults to the active language from the i18n store.
 */
export function t(key: string, vars?: Record<string, string | number>, lang?: Lang): string {
  const l = lang ?? useI18n.getState().lang;
  let s = (l === 'vi' ? VI : EN)[key];
  if (s === undefined) s = EN[key];
  if (s === undefined) return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}
