import { useState } from 'react';
import { CHARACTERS } from '../data/gameData';
import { isValidDisplayName, sanitizeDisplayName } from '../utils/validateName';
import { useProfile } from '../stores/stores';
import { CreationStage, ThumbCanvas } from '../game/CreationStage';
import './CharacterCreation.css';

const BLURBS: Record<string, string> = {
  knight: 'A steadfast warden sworn to the Ancient Tree. First into the mosslight, last to leave it.',
  mage: 'A gentle keeper of spores and lantern-light. Reads the forest like a slow green sentence.',
  rogue: 'A quick pathfinder of briar trails. Knows every shortcut the map forgot.',
};

export function CharacterCreation({ onEnter }: { onEnter: () => void }) {
  const { displayName, characterId, setProfile } = useProfile();
  const [sel, setSel] = useState(characterId || 'knight');
  const [name, setName] = useState(displayName || '');
  const [touched, setTouched] = useState(false);
  const valid = isValidDisplayName(name);
  const active = CHARACTERS.find((c) => c.id === sel) ?? CHARACTERS[0];

  return (
    <div className="creation">
      <div className="creation-bg" aria-hidden="true">
        {Array.from({ length: 26 }).map((_, i) => (
          <span key={i} className={`firefly f${i % 5}`} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }} />
        ))}
      </div>

      <div className="creation-inner">
        <aside className="creation-panel" aria-label="Adventurer setup">
          <p className="creation-kicker">Eldergrove · The Lost Realm</p>
          <h1 className="creation-title">Create Your Adventurer</h1>

          <label className="name-label" htmlFor="dname">Adventurer name</label>
          <input
            id="dname"
            data-testid="name-input"
            className={`name-input ${touched && !valid ? 'invalid' : ''}`}
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Ray"
            autoComplete="off"
            aria-invalid={touched && !valid}
            aria-describedby="name-hint"
          />
          <p id="name-hint" className="name-hint" role={touched && !valid ? 'alert' : undefined}>
            {touched && !valid ? 'Use 1–20 letters — spaces, - _ and \' are welcome.' : '1–20 characters · kept when you switch characters'}
          </p>

          <div className="cards" role="radiogroup" aria-label="Choose a character">
            {CHARACTERS.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={sel === c.id}
                data-testid={`card-${c.id}`}
                className={`char-card ${sel === c.id ? 'selected' : ''}`}
                onClick={() => setSel(c.id)}
              >
                <span className="thumb" aria-hidden="true">
                  <ThumbCanvas modelUrl={c.file} label={c.name} />
                </span>
                <span className="char-meta">
                  <strong>{c.name}</strong>
                  <em>{c.title} · cosmetic only</em>
                </span>
                <span className="char-check" aria-hidden="true">✦</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="creation-stage" aria-label={`3D preview of ${active.name}. Drag to rotate.`}>
          <CreationStage modelUrl={active.file} />
          <p className="stage-caption">Drag to turn · auto-framed head to feet</p>
        </section>

        <footer className="creation-bar">
          <p className="char-blurb">
            <strong>{active.name}</strong> — {BLURBS[active.id] ?? active.description}
          </p>
          <button
            data-testid="enter-forest"
            className="enter-btn"
            disabled={!valid}
            onClick={() => {
              setProfile({ displayName: sanitizeDisplayName(name), characterId: sel });
              onEnter();
            }}
          >
            Enter the Forest →
          </button>
        </footer>
      </div>
    </div>
  );
}
