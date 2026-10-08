import { useEffect, useState } from 'react';
import { CHARACTERS } from '../data/gameData';
import { isValidDisplayName, sanitizeDisplayName } from '../utils/validateName';
import { useProfile } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { loadSave } from '../systems/SaveSystem';
import { CharacterPreview } from '../game/CharacterPreview';
import { startAmbient } from '../systems/AudioSystem';

export function Welcome({ onNew, onContinue, onSettings }: { onNew: () => void; onContinue: () => void; onSettings: () => void }) {
  const [hasSave, setHasSave] = useState(false);
  useEffect(() => { setHasSave(!!loadSave()); }, []);
  return (
    <div className="screen">
      <div className="card">
        <h1 style={{ margin: '4px 0' }}>ELDERGROVE</h1>
        <p style={{ letterSpacing: 4, margin: 0 }}>THE LOST REALM</p>
        <p>A stylized forest adventure. Explore, befriend the spirit, recover 3 fragments, restore the Ancient Tree.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { startAmbient(false); onNew(); }}>New Adventure</button>
          {hasSave && <button onClick={onContinue}>Continue Adventure</button>}
          <button onClick={onSettings}>Settings</button>
        </div>
        <p style={{ fontSize: 13, opacity: 0.8 }}>Free static build · CC0 KayKit assets · progress saves locally</p>
      </div>
    </div>
  );
}

export function CharacterCreation({ onEnter }: { onEnter: () => void }) {
  const { displayName, characterId, setProfile } = useProfile();
  const [sel, setSel] = useState(characterId || 'knight');
  const [name, setName] = useState(displayName || '');
  const [error, setError] = useState<string | null>(null);
  const valid = isValidDisplayName(name);
  const active = CHARACTERS.find((c) => c.id === sel)!;

  return (
    <div className="screen">
      <div className="card">
        <h2>Create Your Adventurer</h2>
        <label htmlFor="dname">Display name (1–20 characters)</label>
        <input id="dname" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ray" autoComplete="off" />
        <div className="char-grid" style={{ marginTop: 12 }}>
          {CHARACTERS.map((c) => (
            <button key={c.id} className={`char-card ${sel === c.id ? 'selected' : ''}`} onClick={() => setSel(c.id)} aria-pressed={sel === c.id}>
              <strong>{c.name}</strong>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{c.title} · cosmetic only</div>
            </button>
          ))}
        </div>
        <CharacterPreview char={active} />
        <p style={{ fontSize: 14 }}>{active.description}</p>
        {error && <p role="alert">{error}</p>}
        <button
          disabled={!valid}
          onClick={() => {
            if (!isValidDisplayName(name)) { setError('Please enter a name of 1–20 letters.'); return; }
            setProfile({ displayName: sanitizeDisplayName(name), characterId: sel });
            setError(null);
            onEnter();
          }}
        >
          Enter the Forest
        </button>
        {!valid && <p style={{ fontSize: 13 }}>Enter a valid name to continue.</p>}
      </div>
    </div>
  );
}

export function IntroCinematic({ onDone }: { onDone: () => void }) {
  const { setPhase } = useUI();
  useEffect(() => {
    const t = setTimeout(() => { onDone(); }, 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  void setPhase;
  return (
    <div className="screen">
      <div className="card">
        <h2>The forest wakes…</h2>
        <p>Mosslight stirs. Somewhere west, the Ancient Tree dreams of rain. Follow the spirit. (Skippable)</p>
        <button onClick={onDone}>Skip — Spawn at Forest Village</button>
      </div>
    </div>
  );
}
