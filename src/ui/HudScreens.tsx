import { useProfile, useProgress, useSettings } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { resetSave } from '../systems/SaveSystem';
import { QUEST_MAIN } from '../data/gameData';

export function HUD({ onPause }: { onPause: () => void }) {
  const { displayName } = useProfile();
  const { spiritFragments, solvedPuzzles } = useProgress();
  const { setShowJournal, setShowMap, setPhotoMode, toast } = useUI();
  const step = Math.min(solvedPuzzles.length, QUEST_MAIN.steps.length - 1);
  return (
    <>
      <div className="hud topbar">
        <span className="chip" aria-label="current objective">◈ {QUEST_MAIN.steps[solvedPuzzles.length === 0 ? 0 : Math.min(step + 0, 4)]} </span>
        <span className="chip" aria-label="fragment counter">✦ {spiritFragments}/3 · {displayName}</span>
        <span className="panel" style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowJournal(true)} aria-label="Open quest journal">Journal</button>
          <button onClick={() => setShowMap(true)} aria-label="Open world map">Map</button>
          <button onClick={() => setPhotoMode(true)} aria-label="Open photo mode">Photo</button>
          <button onClick={onPause} aria-label="Pause game">II</button>
        </span>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

export function DialogueView() {
  const { dialogue, setDialogue } = useUI();
  if (!dialogue) return null;
  return (
    <div className="hud" style={{ bottom: 90, left: '50%', transform: 'translateX(-50%)', width: 'min(92vw,560px)' }}>
      <div className="card panel">
        {dialogue.map((l, i) => <p key={i}>{l}</p>)}
        <button onClick={() => setDialogue(null)}>Continue</button>
      </div>
    </div>
  );
}

export function JournalView() {
  const { showJournal, setShowJournal } = useUI();
  const { completedQuests, solvedPuzzles } = useProgress();
  if (!showJournal) return null;
  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(10,18,14,.7)' }}>
      <div className="card">
        <h2>{QUEST_MAIN.title}</h2>
        <ol style={{ textAlign: 'left' }}>
          {QUEST_MAIN.steps.map((s, i) => <li key={i} style={{ opacity: i <= solvedPuzzles.length ? 1 : 0.55 }}>{s}</li>)}
        </ol>
        <p>Completed quests: {completedQuests.join(', ') || '—'}</p>
        <button onClick={() => setShowJournal(false)}>Close</button>
      </div>
    </div>
  );
}

export function MapView() {
  const { showMap, setShowMap } = useUI();
  if (!showMap) return null;
  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(10,18,14,.7)' }}>
      <div className="card">
        <h2>Eldergrove Map</h2>
        <pre style={{ textAlign: 'left', fontSize: 13 }}>{`              [ANCIENT TREE]\n                    |\n[CRYSTAL LAKE]--[FOREST VILLAGE]--[WHISPERING RUINS]\n                    |\n            [WOODLAND TRAIL]---[MUSHROOM GROVE]\n                    |\n              [SPAWN GATE]`}</pre>
        <button onClick={() => setShowMap(false)}>Close (M)</button>
      </div>
    </div>
  );
}

export function PauseView({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  const { setShowJournal } = useUI();
  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(10,18,14,.7)' }}>
      <div className="card">
        <h2>Paused</h2>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onResume}>Resume (Esc)</button>
          <button onClick={() => setShowJournal(true)}>Quest Journal</button>
          <button onClick={onQuit}>Save & Title</button>
        </div>
      </div>
    </div>
  );
}

export function SettingsView({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const { setProfile } = useProfile();
  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(10,18,14,.85)' }}>
      <div className="card">
        <h2>Settings</h2>
        <label>Quality <select value={s.quality} onChange={(e) => s.setSettings({ quality: e.target.value as typeof s.quality })}><option value="auto">Auto</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label style={{ display: 'block', marginTop: 8 }}>Music <input type="range" min={0} max={1} step={0.05} value={s.musicVolume} onChange={(e) => s.setSettings({ musicVolume: Number(e.target.value) })} /></label>
        <label style={{ display: 'block', marginTop: 8 }}>SFX <input type="range" min={0} max={1} step={0.05} value={s.sfxVolume} onChange={(e) => s.setSettings({ sfxVolume: Number(e.target.value) })} /></label>
        <label style={{ display: 'block', marginTop: 8 }}><input type="checkbox" checked={s.reducedMotion} onChange={(e) => s.setSettings({ reducedMotion: e.target.checked })} /> Reduced motion</label>
        <label style={{ display: 'block', marginTop: 8 }}><input type="checkbox" checked={s.muted} onChange={(e) => s.setSettings({ muted: e.target.checked })} /> Mute all</label>
        <label style={{ display: 'block', marginTop: 8 }}>Display name <input value={useProfile.getState().displayName} onChange={(e) => setProfile({ displayName: e.target.value.slice(0, 20) })} /></label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { if (confirm('Reset saved adventure? This cannot be undone.')) { resetSave(); location.reload(); } }}>Reset Save</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function EndingView({ onRestart }: { onRestart: () => void }) {
  const { displayName } = useProfile();
  return (
    <div className="screen">
      <div className="card">
        <h2>The Tree Remembers {displayName}</h2>
        <p>Lanterns brighten. Mosslight returns. The grove, the lake, the ruins — all breathing again. Thank you for restoring Eldergrove.</p>
        <button onClick={onRestart}>Keep Exploring</button>
      </div>
    </div>
  );
}
