import { useProfile, useProgress, useSettings } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { resetSave } from '../systems/SaveSystem';
import { QUEST_MAIN } from '../data/gameData';

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
const ICONS = {
  book: 'M4 5a1 1 0 0 1 1-1h5v16H5a1 1 0 0 1-1-1z|M20 5a1 1 0 0 0-1-1h-5v16h5a1 1 0 0 0 1-1z',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z|M9 4v14|M15 6v14',
  cam: 'M4 8h3l2-2h6l2 2h3v11H4z|M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  pause: 'M9 5v14|M15 5v14',
  gem: 'M12 3l7 9-7 9-7-9z',
};

export function HUD({ onPause }: { onPause: () => void }) {
  const { spiritFragments, solvedPuzzles } = useProgress();
  const { setShowJournal, setShowMap, setPhotoMode, toast, showJournal, showMap, photoMode } = useUI();
  const step = Math.min(solvedPuzzles.length, QUEST_MAIN.steps.length - 1);
  return (
    <>
      <div className="hud quest-tracker" aria-label="current objective">
        <div className="qt-line"><span className="qt-icon" aria-hidden>◈</span><span>{QUEST_MAIN.steps[step]}</span></div>
        <div className="qt-frag" aria-label="fragment counter"><Icon d={ICONS.gem} />{spiritFragments}/3 Spirit Fragments</div>
      </div>
      <div className="hud hud-tools">
        <button className={`tool-btn${showJournal ? ' on' : ''}`} onClick={() => setShowJournal(true)} aria-label="Open quest journal (J)" title="Journal (J)"><Icon d={ICONS.book} /></button>
        <button className={`tool-btn${showMap ? ' on' : ''}`} onClick={() => setShowMap(true)} aria-label="Open world map (M)" title="Map (M)"><Icon d={ICONS.map} /></button>
        <button className={`tool-btn${photoMode ? ' on' : ''}`} onClick={() => setPhotoMode(true)} aria-label="Open photo mode" title="Photo"><Icon d={ICONS.cam} /></button>
        <button className="tool-btn" onClick={onPause} aria-label="Pause game (Esc)" title="Pause (Esc)"><Icon d={ICONS.pause} /></button>
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
