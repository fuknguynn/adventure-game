import { create } from 'zustand';

export type GamePhase = 'BOOT' | 'PRELOAD' | 'WELCOME' | 'CREATION' | 'CINEMATIC' | 'PLAYING' | 'PAUSED' | 'ENDING';

interface UIState {
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  photoMode: boolean;
  setPhotoMode: (v: boolean) => void;
  showJournal: boolean;
  setShowJournal: (v: boolean) => void;
  showMap: boolean;
  setShowMap: (v: boolean) => void;
  dialogue: string[] | null;
  setDialogue: (d: string[] | null) => void;
  toast: string | null;
  setToast: (t: string | null) => void;
}

export const useUI = create<UIState>((set) => ({
  phase: 'BOOT',
  setPhase: (phase) => set({ phase }),
  photoMode: false,
  setPhotoMode: (photoMode) => set({ photoMode }),
  showJournal: false,
  setShowJournal: (showJournal) => set({ showJournal }),
  showMap: false,
  setShowMap: (showMap) => set({ showMap }),
  dialogue: null,
  setDialogue: (dialogue) => set({ dialogue }),
  toast: null,
  setToast: (toast) => set({ toast }),
}));
