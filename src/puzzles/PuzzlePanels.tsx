import { useState } from 'react';
import { createSequence, tapSequence, isBeamAligned } from '../systems/PuzzleSystem';
import { PUZZLES } from '../data/gameData';
import { useProgress } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { sfx } from '../systems/AudioSystem';

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
  return () => {
    solvePuzzle(id);
    sfx.fragment();
    const names: Record<string, string> = { spirit_path: 'Grove Fragment', rune_sequence: 'Lake Fragment', light_reflection: 'Ruins Fragment' };
    setToast(`✦ ${names[id]} recovered!`);
    setTimeout(() => setToast(null), 2600);
    onClose();
  };
}

function SpiritPathPanel({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState(() => createSequence(PUZZLES.spiritPath.target));
  const [showHint, setShowHint] = useState(false);
  const finish = useSolve('spirit_path', onClose);
  const done = (ns: typeof s) => { setS(ns); if (ns.solved) { sfx.success(); setTimeout(finish, 600); } };
  return (
    <div>
      <h3>Spirit Path — Mushroom Grove</h3>
      <p>Step on the stones in the spirit's order. Shapes + numbers (never color alone).</p>
      <p aria-live="polite">Order: {PUZZLES.spiritPath.target.map((t) => `${SHAPES[t]}${t + 1}`).join(' → ')}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[0, 1, 2, 3].map((i) => (
          <button key={i} style={{ width: 56, height: 56, fontSize: 20, background: s.input.includes(i) ? '#3f6b52' : undefined }} onClick={() => { const ns = tapSequence(s, i); if (ns.mistakes > s.mistakes) sfx.error(); else sfx.interact(); done(ns); }} aria-label={`Stone ${SHAPES[i]} number ${i + 1}`}>
            {SHAPES[i]}{i + 1}
          </button>
        ))}
      </div>
      <p aria-live="polite">Progress: {s.input.length}/{s.target.length} · Mistakes: {s.mistakes}{s.mistakes > 0 && !s.solved ? ' — reset, try again' : ''}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={() => setShowHint(true)}>Hint</button>
        <button onClick={onClose}>Leave</button>
      </div>
      {showHint && <p>{PUZZLES.spiritPath.hint}</p>}
    </div>
  );
}

function RunePanel({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState(() => createSequence(PUZZLES.runeSequence.target));
  const [replay, setReplay] = useState(true);
  const finish = useSolve('rune_sequence', onClose);
  return (
    <div>
      <h3>Rune Sequence — Crystal Lake</h3>
      <p>The runes sing: {replay ? PUZZLES.runeSequence.target.map((t) => `${SHAPES[t]}${t + 1}`).join(' → ') : '(hidden — press Replay)'} </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[0, 1, 2, 3].map((i) => (
          <button key={i} style={{ width: 56, height: 56, fontSize: 20 }} onClick={() => { const ns = tapSequence(s, i); setS(ns); if (ns.mistakes > s.mistakes) sfx.error(); else sfx.interact(); if (ns.solved) { sfx.success(); setTimeout(finish, 600); } }} aria-label={`Rune ${SHAPES[i]} ${i + 1}`}>{SHAPES[i]}{i + 1}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
        <button onClick={() => setReplay(true)}>Replay clue</button>
        <button onClick={onClose}>Leave</button>
      </div>
      <p>{PUZZLES.runeSequence.hint}</p>
    </div>
  );
}

function LightPanel({ onClose }: { onClose: () => void }) {
  const [dials, setDials] = useState([0, 0, 0]);
  const finish = useSolve('light_reflection', onClose);
  const aligned = isBeamAligned(dials, PUZZLES.lightReflection.targets);
  return (
    <div>
      <h3>Light Reflection — Whispering Ruins</h3>
      <p>Rotate each crystal (0–3) until all beams run straight. Current: {dials.join(' · ')} Target pattern shown as numbers.</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {dials.map((d, i) => (
          <button key={i} onClick={() => { const n = [...dials]; n[i] = (n[i] + 1) % 4; setDials(n); sfx.interact(); if (isBeamAligned(n, PUZZLES.lightReflection.targets)) { sfx.success(); setTimeout(finish, 600); } }} aria-label={`Rotate crystal ${i + 1}, now ${d}`}>
            ◈{i + 1}: {d}
          </button>
        ))}
      </div>
      <div aria-live="polite" style={{ marginTop: 8, height: 10, background: aligned ? '#7df0d4' : '#3a2b5c', borderRadius: 6 }} />
      <p>{aligned ? 'Beams aligned!' : PUZZLES.lightReflection.hint}</p>
      <button onClick={onClose}>Leave</button>
    </div>
  );
}
