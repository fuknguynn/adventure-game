import { useCallback, useEffect, useState } from 'react';
import { useProfile, useProgress, useSettings } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { loadSave, writeSave, collectSave } from '../systems/SaveSystem';
import { setAudioPrefs, startAmbient } from '../systems/AudioSystem';
import { Welcome, IntroCinematic } from '../ui/Onboarding';
import { CharacterCreation } from '../ui/CharacterCreation';
import { SettingsView, EndingView } from '../ui/HudScreens';
import { GameCanvas } from '../game/GameCanvas';

export function App() {
  const { phase, setPhase } = useUI();
  const profile = useProfile();
  const progress = useProgress();
  const settings = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [booted, setBooted] = useState(false);

  // BOOT → restore save or WELCOME
  useEffect(() => {
    const s = loadSave();
    if (s) {
      useProfile.setState({ displayName: s.profile.displayName, characterId: s.profile.characterId });
      useProgress.setState({ ...s.progress, setProgress: useProgress.getState().setProgress, solvePuzzle: useProgress.getState().solvePuzzle });
      // `muted` is normalized by loadSave/migrateSave (missing → false).
      useSettings.setState({ ...s.settings, setSettings: useSettings.getState().setSettings });
    }
    setPhase(s && s.profile.displayName ? 'WELCOME' : 'WELCOME');
    setBooted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // audio prefs follow settings
  useEffect(() => {
    setAudioPrefs({ muted: settings.muted, musicVolume: settings.musicVolume, sfxVolume: settings.sfxVolume });
  }, [settings.muted, settings.musicVolume, settings.sfxVolume]);

  // autosave at checkpoints: whenever progress/profile/settings change mid-game
  useEffect(() => {
    if (!booted || (phase !== 'PLAYING' && phase !== 'PAUSED')) return;
    const t = setTimeout(() => {
      writeSave(collectSave(
        { displayName: profile.displayName, characterId: profile.characterId },
        { regionId: progress.regionId, spawnId: progress.spawnId, completedQuests: progress.completedQuests, solvedPuzzles: progress.solvedPuzzles, spiritFragments: progress.spiritFragments, worldRestored: progress.worldRestored },
        { quality: settings.quality, musicVolume: settings.musicVolume, sfxVolume: settings.sfxVolume, reducedMotion: settings.reducedMotion, muted: settings.muted },
      ));
    }, 400);
    return () => clearTimeout(t);
  }, [booted, phase, profile.displayName, profile.characterId, progress, settings]);

  // Esc / M shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && phase === 'PLAYING') setPhase('PAUSED');
      else if (e.code === 'Escape' && phase === 'PAUSED') setPhase('PLAYING');
      if (e.code === 'KeyM' && phase === 'PLAYING') useUI.getState().setShowMap(!useUI.getState().showMap);
      if (e.code === 'KeyJ' && phase === 'PLAYING') useUI.getState().setShowJournal(true);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase, setPhase]);

  const persistAll = useCallback(() => {
    writeSave(collectSave(
      { displayName: useProfile.getState().displayName, characterId: useProfile.getState().characterId },
      { regionId: useProgress.getState().regionId, spawnId: useProgress.getState().spawnId, completedQuests: useProgress.getState().completedQuests, solvedPuzzles: useProgress.getState().solvedPuzzles, spiritFragments: useProgress.getState().spiritFragments, worldRestored: useProgress.getState().worldRestored },
      { quality: useSettings.getState().quality, musicVolume: useSettings.getState().musicVolume, sfxVolume: useSettings.getState().sfxVolume, reducedMotion: useSettings.getState().reducedMotion, muted: useSettings.getState().muted },
    ));
  }, []);

  if (!booted || phase === 'BOOT') return <div className="screen"><div className="card"><p>Waking the forest…</p></div></div>;

  return (
    <>
      {phase === 'WELCOME' && (
        <Welcome
          onNew={() => setPhase('CREATION')}
          onContinue={() => { startAmbient(useProgress.getState().worldRestored); setPhase('PLAYING'); }}
          onSettings={() => setShowSettings(true)}
        />
      )}
      {phase === 'CREATION' && <CharacterCreation onEnter={() => { persistAll(); startAmbient(false); setPhase('CINEMATIC'); }} />}
      {phase === 'CINEMATIC' && <IntroCinematic onDone={() => setPhase('PLAYING')} />}
      {(phase === 'PLAYING' || phase === 'PAUSED') && (
        <GameCanvas
          onExit={() => { persistAll(); setPhase('WELCOME'); }}
          onEnding={() => { persistAll(); setPhase('ENDING'); }}
        />
      )}
      {phase === 'ENDING' && <EndingView onRestart={() => setPhase('PLAYING')} />}
      {showSettings && <SettingsView onClose={() => { setShowSettings(false); persistAll(); }} />}
    </>
  );
}
