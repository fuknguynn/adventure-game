import { useState } from 'react';
import { CHARACTERS } from '../data/gameData';
import { isValidDisplayName, sanitizeDisplayName } from '../utils/validateName';
import { useProfile } from '../stores/stores';
import { CreationStage, ThumbCanvas } from '../game/CreationStage';
import { useT } from '../i18n';
import './CharacterCreation.css';

const BLURBS: Record<string, string> = {
  knight: 'ui.creation.class.knight',
  mage: 'ui.creation.class.mage',
  rogue: 'ui.creation.class.rogue',
};

export function CharacterCreation({ onEnter }: { onEnter: () => void }) {
  const t = useT();
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
        <aside className="creation-panel" aria-label={t('ui.creation.setup')}>
          <p className="creation-kicker">{t('ui.creation.kicker')}</p>
          <h1 className="creation-title">{t('ui.creation.title')}</h1>

          <label className="name-label" htmlFor="dname">{t('ui.creation.nameLabel')}</label>
          <input
            id="dname"
            data-testid="name-input"
            className={`name-input ${touched && !valid ? 'invalid' : ''}`}
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={t('ui.creation.namePlaceholder')}
            autoComplete="off"
            aria-invalid={touched && !valid}
            aria-describedby="name-hint"
          />
          <p id="name-hint" className="name-hint" role={touched && !valid ? 'alert' : undefined}>
            {touched && !valid ? t('ui.creation.nameError') : t('ui.creation.nameHint')}
          </p>

          <div className="cards" role="radiogroup" aria-label={t('ui.creation.choose')}>
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
                  <strong>{t(c.name)}</strong>
                  <em>{t(c.title)} · {t('ui.creation.cosmeticOnly')}</em>
                </span>
                <span className="char-check" aria-hidden="true">✦</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="creation-stage" aria-label={t('ui.creation.preview', { name: t(active.name) })}>
          <CreationStage modelUrl={active.file} />
          <p className="stage-caption">{t('ui.creation.stageCaption')}</p>
        </section>

        <footer className="creation-bar">
          <p className="char-blurb">
            <strong>{t(active.name)}</strong> — {t(BLURBS[active.id] ?? active.description)}
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
            {t('ui.creation.enter')}
          </button>
        </footer>
      </div>
    </div>
  );
}
