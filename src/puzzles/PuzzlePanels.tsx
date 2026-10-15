import { useState } from 'react';
import { createSequence, tapSequence, isBeamAligned } from '../systems/PuzzleSystem';
import { PUZZLES } from '../data/gameData';
import { useProgress } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { sfx } from '../systems/AudioSystem';
import { t } from '../i18n';
import { useI18n } from '../stores/i18nStore';
import { useT } from '../i18n';

const SHAPES = ['●', '▲', '■', '◆'];

export function PuzzlePanels({ active, onClose }: { active: string | null; onClose: () => void }) {
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(10,18,14,.72)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card" style={{ maxWidth: 480 }}>
        {active === 'spirit_path' && <SpiritPathPanel onClose={onClose} />}
        {active === 'rune_sequence' && <RunePanel onClose={onClose} />}
        {active === 'light_reflection' && <LightPanel onClose={onClose} />}
      </div>
    </div>
  );
}

function useSolve(id: 'spirit_path' | 'rune_sequence' | 'light_reflection', onClose: () => void) {
  const { solvePuzzle } = useProgress();
  const { setToast } = useUI();
  useI18n((s) => s.lang);
  return () => {
    solvePuzzle(id);
    sfx.fragment();
    const names: Record<string, string> = {
      spirit_path: t('puzzle.fragment.grove'),
      rune_sequence: t('puzzle.fragment.lake'),
      light_reflection: t('puzzle.fragment.ruins'),
    };
    setToast(t('puzzle.recovered', { name: names[id] }));
    setTimeout(() => setToast(null), 2600);
    onClose();
  };
}

function SpiritPathPanel({ onClose }: { onClose: () => void }) {
  const tt = useT();
  const [s, setS] = useState(() => createSequence(PUZZLES.spiritPath.target));
  const [showHint, setShowHint] = useState(false);
  const finish = useSolve('spirit_path', onClose);
  const done = (ns: typeof s) => { setS(ns); if (ns.solved) { sfx.success(); setTimeout(finish, 600); } };
  return (
    <div>
      <h3>{tt('puzzle.spirit_path.title')}</h3>
      <p>{tt('puzzle.spirit_path.instructions')}</p>
      <p aria-live="polite">{tt('puzzle.order', { seq: PUZZLES.spiritPath.target.map((n) => `${SHAPES[n]}${n + 1}`).join(' → ') })}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[0, 1, 2, 3].map((i) => (
          <button key={i} style={{ width: 56, height: 56, fontSize: 20, background: s.input.includes(i) ? '#3f6b52' : undefined }} onClick={() => { const ns = tapSequence(s, i); if (ns.mistakes > s.mistakes) sfx.error(); else sfx.interact(); done(ns); }} aria-label={tt('puzzle.stone', { shape: SHAPES[i], n: i + 1 })}>
            {SHAPES[i]}{i + 1}
          </button>
        ))}
      </div>
      <p aria-live="polite">{tt('puzzle.progress', { done: s.input.length, total: s.target.length, mistakes: s.mistakes })}{s.mistakes > 0 && !s.solved ? ` — ${tt('puzzle.reset')}` : ''}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={() => setShowHint(true)}>{tt('puzzle.hint')}</button>
        <button onClick={onClose}>{tt('puzzle.leave')}</button>
      </div>
      {showHint && <p>{tt(PUZZLES.spiritPath.hint)}</p>}
    </div>
  );
}

function RunePanel({ onClose }: { onClose: () => void }) {
  const tt = useT();
  const [s, setS] = useState(() => createSequence(PUZZLES.runeSequence.target));
  const [replay, setReplay] = useState(true);
  const finish = useSolve('rune_sequence', onClose);
  return (
    <div>
      <h3>{tt('puzzle.rune.title')}</h3>
      <p>{tt('puzzle.rune.instructions', { seq: replay ? PUZZLES.runeSequence.target.map((n) => `${SHAPES[n]}${n + 1}`).join(' → ') : tt('puzzle.rune.hidden') })}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[0, 1, 2, 3].map((i) => (
          <button key={i} style={{ width: 56, height: 56, fontSize: 20 }} onClick={() => { const ns = tapSequence(s, i); setS(ns); if (ns.mistakes > s.mistakes) sfx.error(); else sfx.interact(); if (ns.solved) { sfx.success(); setTimeout(finish, 600); } }} aria-label={tt('puzzle.rune', { shape: SHAPES[i], n: i + 1 })}>{SHAPES[i]}{i + 1}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
        <button onClick={() => setReplay(true)}>{tt('puzzle.replay')}</button>
        <button onClick={onClose}>{tt('puzzle.leave')}</button>
      </div>
      <p>{tt(PUZZLES.runeSequence.hint)}</p>
    </div>
  );
}

function LightPanel({ onClose }: { onClose: () => void }) {
  const tt = useT();
  const [dials, setDials] = useState([0, 0, 0]);
  const finish = useSolve('light_reflection', onClose);
  const aligned = isBeamAligned(dials, PUZZLES.lightReflection.targets);
  return (
    <div>
      <h3>{tt('puzzle.light.title')}</h3>
      <p>{tt('puzzle.light.instructions', { current: dials.join(' · ') })}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {dials.map((d, i) => (
          <button key={i} onClick={() => { const n = [...dials]; n[i] = (n[i] + 1) % 4; setDials(n); sfx.interact(); if (isBeamAligned(n, PUZZLES.lightReflection.targets)) { sfx.success(); setTimeout(finish, 600); } }} aria-label={tt('puzzle.crystal', { n: i + 1, v: d })}>
            ◈{i + 1}: {d}
          </button>
        ))}
      </div>
      <div aria-live="polite" style={{ marginTop: 8, height: 10, background: aligned ? '#7df0d4' : '#3a2b5c', borderRadius: 6 }} />
      <p>{aligned ? tt('puzzle.light.aligned') : tt(PUZZLES.lightReflection.hint)}</p>
      <button onClick={onClose}>{tt('puzzle.leave')}</button>
    </div>
  );
}
