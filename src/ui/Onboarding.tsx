import { useEffect, useState } from 'react';
import { loadSave } from '../systems/SaveSystem';
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

export function IntroCinematic({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => { onDone(); }, 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
