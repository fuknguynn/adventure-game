import { useEffect, useState } from 'react';
import { loadSave } from '../systems/SaveSystem';
import { initAudio } from '../systems/AudioSystem';
import { useT } from '../i18n';

export function Welcome({ onNew, onContinue, onSettings }: { onNew: () => void; onContinue: () => void; onSettings: () => void }) {
  const t = useT();
  const [hasSave, setHasSave] = useState(false);
  useEffect(() => { setHasSave(!!loadSave()); }, []);
  return (
    <div className="screen">
      <div className="card">
        <h1 style={{ margin: '4px 0' }}>{t('ui.welcome.title')}</h1>
        <p style={{ letterSpacing: 4, margin: 0 }}>{t('ui.welcome.subtitle')}</p>
        <p>{t('ui.welcome.description')}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { initAudio('village'); onNew(); }}>{t('ui.welcome.new')}</button>
          {hasSave && <button onClick={onContinue}>{t('ui.welcome.continue')}</button>}
          <button onClick={onSettings}>{t('ui.welcome.settings')}</button>
        </div>
        <p style={{ fontSize: 13, opacity: 0.8 }}>{t('ui.welcome.footer')}</p>
      </div>
    </div>
  );
}

export function IntroCinematic({ onDone }: { onDone: () => void }) {
  const t = useT();
  useEffect(() => {
    const timer = setTimeout(() => { onDone(); }, 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="screen">
      <div className="card">
        <h2>{t('ui.cinematic.heading')}</h2>
        <p>{t('ui.cinematic.text')}</p>
        <button onClick={onDone}>{t('ui.cinematic.skip')}</button>
      </div>
    </div>
  );
}
