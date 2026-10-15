import { useCallback } from 'react';
import { t } from './index';
import { useI18n } from '../stores/i18nStore';

/**
 * Component hook: returns a `t` bound to the current language.
 * Re-renders (via zustand) when the language changes.
 */
export function useT() {
  const lang = useI18n((s) => s.lang);
  return useCallback((key: string, vars?: Record<string, string | number>) => t(key, vars, lang), [lang]);
}
