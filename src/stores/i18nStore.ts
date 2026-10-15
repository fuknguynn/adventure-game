import { create } from 'zustand';

export type Lang = 'vi' | 'en';

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useI18n = create<I18nState>((set) => ({
  lang: 'vi',
  setLang: (lang) => set({ lang }),
}));
