import { useEffect } from 'react';
import { joyMove, touchFlags, camOrbit } from '../game/input';

export function TouchControls({ onInteract }: { onInteract: () => void }) {
  useEffect(() => {
    let joyId: number | null = null;
    let camId: number | null = null;
    let ox = 0, oy = 0, lx = 0, ly = 0;
    const ds = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX < innerWidth * 0.45 && joyId === null) { joyId = t.identifier; ox = t.clientX; oy = t.clientY; }
        else if (camId === null) { camId = t.identifier; lx = t.clientX; ly = t.clientY; }
      }
    };
    const mv = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyId) {
          joyMove.x = Math.max(-1, Math.min(1, (t.clientX - ox) / 50));
          joyMove.z = Math.max(-1, Math.min(1, (t.clientY - oy) / 50));
        } else if (t.identifier === camId) {
          camOrbit.yaw -= (t.clientX - lx) * 0.008;
          camOrbit.pitch = Math.max(0.12, Math.min(1.25, camOrbit.pitch + (t.clientY - ly) * 0.006));
          lx = t.clientX; ly = t.clientY;
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    const up = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyId) { joyId = null; joyMove.x = 0; joyMove.z = 0; }
        if (t.identifier === camId) camId = null;
      }
    };
    const el = document.getElementById('touchzone');
    el?.addEventListener('touchstart', ds, { passive: true });
    el?.addEventListener('touchmove', mv, { passive: false });
    el?.addEventListener('touchend', up);
    el?.addEventListener('touchcancel', up);
    return () => { el?.removeEventListener('touchstart', ds); el?.removeEventListener('touchmove', mv); el?.removeEventListener('touchend', up); el?.removeEventListener('touchcancel', up); };
  }, []);

  return (
    <div id="touchzone" style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 14, bottom: 'calc(18px + env(safe-area-inset-bottom))', pointerEvents: 'auto', display: 'flex', gap: 10 }}>
        <button className="touch-btn" aria-label="Jump" onTouchStart={() => { touchFlags.jump = true; }} onClick={() => { touchFlags.jump = true; }}>⤒</button>
        <button className="touch-btn" aria-label="Sprint toggle" onClick={() => { touchFlags.sprint = !touchFlags.sprint; }}>»</button>
      </div>
      <div style={{ position: 'absolute', right: 14, bottom: 'calc(18px + env(safe-area-inset-bottom))', pointerEvents: 'auto', display: 'flex', gap: 10 }}>
        <button className="touch-btn" aria-label="Spirit ability" onClick={onInteract}>✦</button>
        <button className="touch-btn" aria-label="Interact" onClick={onInteract}>E</button>
      </div>
    </div>
  );
}
