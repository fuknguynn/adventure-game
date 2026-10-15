import { useProfile, useProgress, useSettings } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { resetSave } from '../systems/SaveSystem';
import { QUEST_MAIN } from '../data/gameData';
import { currentObjective } from '../data/depthData';
import { ui, sfx } from '../systems/AudioSystem';
import { useT, t, useI18n } from '../i18n';

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
  const t = useT();
  const { spiritFragments, solvedPuzzles, miniObjectives } = useProgress();
  const { setShowJournal, setShowMap, setPhotoMode, toast, showJournal, showMap, photoMode } = useUI();
  const objective = currentObjective(solvedPuzzles, miniObjectives);
  return (
    <>
      <div className="hud quest-tracker" aria-label={t('hud.aria.objective')}>
        <div className="qt-line"><span className="qt-icon" aria-hidden>◈</span><span>{t(objective)}</span></div>
        <div className="qt-frag" aria-label={t('hud.aria.fragments')}><Icon d={ICONS.gem} />{t('hud.fragments', { n: spiritFragments })}</div>
      </div>
      <div className="hud hud-tools">
        <button className={`tool-btn${showJournal ? ' on' : ''}`} onClick={() => { ui.click(); sfx.journalOpen(); setShowJournal(true); }} onMouseEnter={() => ui.hover()} aria-label={t('hud.tool.journal_aria')} title={t('hud.tool.journal_title')}><Icon d={ICONS.book} /></button>
        <button className={`tool-btn${showMap ? ' on' : ''}`} onClick={() => { ui.click(); sfx.mapOpen(); setShowMap(true); }} onMouseEnter={() => ui.hover()} aria-label={t('hud.tool.map_aria')} title={t('hud.tool.map_title')}><Icon d={ICONS.map} /></button>
        <button className={`tool-btn${photoMode ? ' on' : ''}`} onClick={() => { ui.click(); sfx.photoMode(); setPhotoMode(true); }} onMouseEnter={() => ui.hover()} aria-label={t('hud.tool.photo_aria')} title={t('hud.tool.photo_title')}><Icon d={ICONS.cam} /></button>
        <button className="tool-btn" onClick={() => { ui.click(); onPause(); }} onMouseEnter={() => ui.hover()} aria-label={t('hud.tool.pause_aria')} title={t('hud.tool.pause_title')}><Icon d={ICONS.pause} /></button>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

export function DialogueView() {
  const t = useT();
  const { dialogue, setDialogue } = useUI();
  if (!dialogue) return null;
  return (
    <div className="hud" style={{ bottom: 90, left: '50%', transform: 'translateX(-50%)', width: 'min(92vw,560px)' }}>
      <div className="card panel">
        {dialogue.map((l, i) => <p key={i}>{t(l)}</p>)}
        <button onClick={() => setDialogue(null)}>{t('ui.dialogue.continue')}</button>
      </div>
    </div>
  );
}

export function JournalView() {
  const t = useT();
  const { showJournal, setShowJournal } = useUI();
  const { completedQuests, solvedPuzzles } = useProgress();
  if (!showJournal) return null;
  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(10,18,14,.7)' }}>
      <div className="card">
        <h2>{t(QUEST_MAIN.title)}</h2>
        <ol style={{ textAlign: 'left' }}>
          {QUEST_MAIN.steps.map((s, i) => <li key={i} style={{ opacity: i <= solvedPuzzles.length ? 1 : 0.55 }}>{t(s)}</li>)}
        </ol>
        <p>{t('hud.journal.completed', { list: completedQuests.join(', ') || '—' })}</p>
        <button onClick={() => setShowJournal(false)}>{t('ui.common.close')}</button>
      </div>
    </div>
  );
}

export function MapView() {
  const t = useT();
  const { showMap, setShowMap } = useUI();
  if (!showMap) return null;
  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(10,18,14,.7)' }}>
      <div className="card">
        <h2>{t('hud.map.title')}</h2>
        <pre style={{ textAlign: 'left', fontSize: 13 }}>{t('hud.map.diagram', { tree: t('region.map.ancient_tree'), lake: t('region.map.crystal_lake'), village: t('region.map.forest_village'), ruins: t('region.map.whispering_ruins'), trail: t('region.map.woodland_trail'), grove: t('region.map.mushroom_grove'), gate: t('region.map.spawn_gate') })}</pre>
        <button onClick={() => setShowMap(false)}>{t('hud.map.close')}</button>
      </div>
    </div>
  );
}

export function PauseView({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  const t = useT();
  const { setShowJournal } = useUI();
  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(10,18,14,.7)' }}>
      <div className="card">
        <h2>{t('hud.pause.title')}</h2>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onResume}>{t('hud.pause.resume')}</button>
          <button onClick={() => setShowJournal(true)}>{t('hud.pause.journal')}</button>
          <button onClick={onQuit}>{t('hud.pause.quit')}</button>
        </div>
      </div>
    </div>
  );
}

export function SettingsView({ onClose }: { onClose: () => void }) {
  const t = useT();
  const s = useSettings();
  const { setProfile } = useProfile();
  const lang = useI18n((st) => st.lang);
  const { setLang } = useI18n();
  const pickLang = (l: 'vi' | 'en') => { setLang(l); s.setSettings({ lang: l }); };
  return (
    <div className="screen" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(10,18,14,.85)' }}>
      <div className="card">
        <h2>{t('settings.title')}</h2>
        <label>{t('settings.quality')} <select value={s.quality} onChange={(e) => s.setSettings({ quality: e.target.value as typeof s.quality })}><option value="auto">{t('settings.quality.auto')}</option><option value="low">{t('settings.quality.low')}</option><option value="medium">{t('settings.quality.medium')}</option><option value="high">{t('settings.quality.high')}</option></select></label>
        <label style={{ display: 'block', marginTop: 8 }}>{t('settings.music')} <input type="range" min={0} max={1} step={0.05} value={s.musicVolume} onChange={(e) => s.setSettings({ musicVolume: Number(e.target.value) })} /></label>
        <label style={{ display: 'block', marginTop: 8 }}>{t('settings.sfx')} <input type="range" min={0} max={1} step={0.05} value={s.sfxVolume} onChange={(e) => s.setSettings({ sfxVolume: Number(e.target.value) })} /></label>
        <label style={{ display: 'block', marginTop: 8 }}><input type="checkbox" checked={s.reducedMotion} onChange={(e) => s.setSettings({ reducedMotion: e.target.checked })} /> {t('settings.reducedMotion')}</label>
        <label style={{ display: 'block', marginTop: 8 }}><input type="checkbox" checked={s.muted} onChange={(e) => s.setSettings({ muted: e.target.checked })} /> {t('settings.muted')}</label>
        <label style={{ display: 'block', marginTop: 8 }}>{t('settings.language')} <select value={lang} onChange={(e) => pickLang(e.target.value as 'vi' | 'en')}><option value="vi">{t('settings.lang.vi')}</option><option value="en">{t('settings.lang.en')}</option></select></label>
        <label style={{ display: 'block', marginTop: 8 }}>{t('settings.displayName')} <input value={useProfile.getState().displayName} onChange={(e) => setProfile({ displayName: e.target.value.slice(0, 20) })} /></label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { if (confirm(t('settings.reset_confirm'))) { resetSave(); location.reload(); } }}>{t('settings.reset_save')}</button>
          <button onClick={onClose}>{t('ui.common.close')}</button>
        </div>
      </div>
    </div>
  );
}

export function EndingView({ onRestart }: { onRestart: () => void }) {
  const t = useT();
  const { displayName } = useProfile();
  return (
    <div className="screen">
      <div className="card">
        <h2>{t('ending.heading', { name: displayName })}</h2>
        <p>{t('ending.text')}</p>
        <button onClick={onRestart}>{t('ending.keep_exploring')}</button>
      </div>
    </div>
  );
}
