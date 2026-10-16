import { useEffect, useRef, useState } from 'react';
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
  const idxRef = useRef(0);
  const [idx, setIdx] = useState(0);
  useEffect(() => { idxRef.current = 0; setIdx(0); }, [dialogue]);
  if (!dialogue) return null;
  const last = dialogue.length - 1;
  // advance via a ref (not the render-closure idx) so multiple rapid clicks
  // on the same mounted button each see the current line — no stale skip,
  // no corruption. On the last line it closes.
  const advance = () => {
    const next = idxRef.current + 1;
    if (next > last) setDialogue(null);
    else { idxRef.current = next; setIdx(next); }
  };
  return (
    <div className="dialogue">
      <div className="card dialogue-card">
        <p className="dialogue-speaker">{t('ui.dialogue.speaker')}</p>
        <p className="dialogue-line" aria-live="polite">{t(dialogue[idx])}</p>
        <button className="dialogue-continue" onClick={advance} aria-label={t('ui.dialogue.continue')}>
          <span className="dialogue-continue-text">{t('ui.dialogue.continue')}</span>
          <span aria-hidden>▾</span>
        </button>
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
    <div className="overlay">
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

// ---- World map (SVG) ----
const MAP_NODES = [
  { id: 'village', x: 300, y: 212, label: 'region.village', desc: 'village', labelDy: 38, magical: false, emblem: 'M-9 6V-2l9-7 9 7v8h-6V1h-6v5z', fragmentName: null },
  { id: 'tree', x: 300, y: 74, label: 'region.tree', desc: 'ancient_tree', labelDy: -44, magical: true, emblem: 'M0 -9C6.4 -3.6 5.6 4 0 9C-5.6 4 -6.4 -3.6 0 -9Z', fragmentName: null },
  { id: 'ruins', x: 104, y: 152, label: 'region.ruins', desc: 'whispering_ruins', labelDy: -44, magical: true, emblem: 'M-10 -6h4v12h-4zM4 -6h4v12h-4zM-2 -10h4v16h-4zM-11 6h22v4h-22z', fragmentName: 'puzzle.fragment.ruins' },
  { id: 'lake', x: 496, y: 152, label: 'region.lake', desc: 'crystal_lake', labelDy: -44, magical: false, emblem: 'M0 -8l7 8-7 8-7-8z', fragmentName: 'puzzle.fragment.lake' },
  { id: 'grove', x: 300, y: 344, label: 'region.grove', desc: 'mushroom_grove', labelDy: 42, magical: false, emblem: 'M-11 -1a11 7.5 0 0 1 22 0zM-3 -1h6v9h-6z', fragmentName: 'puzzle.fragment.grove' },
  { id: 'spirit', x: 398, y: 262, label: 'region.spirit', desc: 'spirit_clearing', labelDy: 36, magical: true, emblem: 'M0 -8C4.4 -3.4 3.6 3.4 0 8C-3.6 3.4 -4.4 -3.4 0 -8Z', fragmentName: null },
] as const;
const MAP_PUZZLE: Record<string, string | undefined> = { village: undefined, tree: undefined, ruins: 'light_reflection', lake: 'rune_sequence', grove: 'spirit_path', spirit: undefined };

function MapNode({ n, state, selected, onSelect, label, ariaNow }: { n: (typeof MAP_NODES)[number]; state: 'current' | 'completed' | 'idle'; selected: boolean; onSelect: () => void; label: string; ariaNow: string }) {
  const stroke = state === 'current' ? '#5eead4' : state === 'completed' ? '#5eead4' : n.magical ? 'rgba(94,234,212,.6)' : 'rgba(216,187,120,.55)';
  const fill = n.magical ? 'rgba(94,234,212,.10)' : 'rgba(216,187,120,.08)';
  return (
    <g className={`wmap-node wmap-${state}${selected ? ' wmap-selected' : ''}`} transform={`translate(${n.x} ${n.y})`} onClick={onSelect} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }} tabIndex={0} role="button" aria-pressed={selected} aria-label={`${label} — ${ariaNow}`}>
      {state === 'current' && <circle r="27" fill="none" stroke="#5eead4" strokeOpacity=".28" strokeWidth="7" />}
      {selected && <circle r="24.5" fill="none" stroke="#f4e9c9" strokeWidth="1.6" strokeOpacity=".9" strokeDasharray="4 3" />}
      <circle r="20" fill={fill} stroke={stroke} strokeWidth={state === 'current' ? 2.4 : 1.6} />
      <path d={n.emblem} transform="translate(0 -1)" fill={stroke} fillOpacity={n.magical ? .95 : .9} />
      {state === 'completed' && (
        <g transform="translate(13 -13)">
          <circle r="7" fill="#1e3027" stroke="#5eead4" strokeWidth="1.2" />
          <path d="M-3.2 0l2.3 2.4 4.2-4.6" fill="none" stroke="#5eead4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      <text y={n.labelDy} textAnchor="middle" className="wmap-label">{label}</text>
    </g>
  );
}

export function MapView() {
  const t = useT();
  const { showMap, setShowMap } = useUI();
  const { regionId, solvedPuzzles, spiritFragments } = useProgress();
  const [selected, setSelected] = useState<string>('village');
  useEffect(() => {
    if (!showMap) return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'KeyM') setShowMap(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showMap, setShowMap]);
  if (!showMap) return null;
  const regionNorm = regionId.replace(/^forest_/, '') || regionId;
  const current = regionNorm === 'village' || regionNorm === 'spirit' ? regionNorm : MAP_NODES.some((x) => x.id === regionNorm) ? regionNorm : 'village';
  const stateOf = (id: string): 'current' | 'completed' | 'idle' => id === current ? 'current' : (MAP_PUZZLE[id] && solvedPuzzles.includes(MAP_PUZZLE[id] as string)) ? 'completed' : 'idle';
  const sel = MAP_NODES.find((n) => n.id === selected) ?? MAP_NODES[0];
  const selState = stateOf(sel.id);
  const selLabel = t(sel.label);
  const stateText = selState === 'current' ? t('hud.map.state.current') : selState === 'completed' ? t('hud.map.state.completed') : t('hud.map.state.discovered');
  return (
    <div className="overlay">
      <div className="card wmap-card">
        <h2>{t('hud.map.title')}</h2>
        <div className="wmap-wrap">
          <svg viewBox="0 0 600 420" className="wmap-svg" role="img" aria-label={t('hud.map.title')}>
            <defs>
              <radialGradient id="wmap-bg" cx="50%" cy="42%" r="75%">
                <stop offset="0%" stopColor="#22362c" />
                <stop offset="62%" stopColor="#182a22" />
                <stop offset="100%" stopColor="#111f19" />
              </radialGradient>
            </defs>
            <rect x="4" y="4" width="592" height="412" rx="14" fill="url(#wmap-bg)" stroke="rgba(216,187,120,.25)" />
            {/* Route lines: village hub → each region */}
            {MAP_NODES.filter((n) => n.id !== 'village').map((n) => {
              const active = n.id === current || n.id === selected;
              return <line key={n.id} x1="300" y1="212" x2={n.x} y2={n.y} className={`wmap-route${active ? ' wmap-route-on' : ''}`} />;
            })}
            {MAP_NODES.map((n) => (
              <MapNode key={n.id} n={n} state={stateOf(n.id)} selected={selected === n.id} onSelect={() => setSelected(n.id)} label={t(n.label)} ariaNow={stateOf(n.id) === 'current' ? t('hud.map.state.current') : stateOf(n.id) === 'completed' ? t('hud.map.state.completed') : t('hud.map.state.discovered')} />
            ))}
          </svg>
        </div>
        <div className="wmap-detail" aria-live="polite">
          <div className="wmap-detail-head">
            <strong>{selLabel}</strong>
            <span className={`wmap-badge wmap-badge-${selState}`}>{stateText}</span>
          </div>
          <p className="wmap-desc">{t(`hud.map.desc.${sel.desc}`)}</p>
          {selState === 'completed' && sel.fragmentName && <p className="wmap-frag">✦ {t(sel.fragmentName)}</p>}
          {selState === 'current' && <p className="wmap-frag">✦ {t('hud.fragments', { n: spiritFragments })}</p>}
        </div>
        <button onClick={() => setShowMap(false)}>{t('hud.map.close')}</button>
      </div>
    </div>
  );
}

export function PauseView({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  const t = useT();
  const { setShowJournal } = useUI();
  return (
    <div className="overlay">
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
    <div className="overlay">
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
