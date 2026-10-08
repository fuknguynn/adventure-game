import { useEffect, useRef } from 'react';
import { joyMove, touchFlags, camOrbit, JOY_ZONE } from '../game/input';

export function TouchControls({ onInteract }: { onInteract: () => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const stick = (x: number, y: number, dx: number, dy: number, show: boolean) => {
    const b = baseRef.current, k = knobRef.current;
    if (!b || !k) return;
    b.style.display = k.style.display = show ? 'block' : 'none';
    if (!show) return;
    b.style.left = `${x - 50}px`; b.style.top = `${y - 50}px`;
    k.style.transform = `translate(${x - 22 + dx}px, ${y - 22 + dy}px)`;
  };
  useEffect(() => {
    let joyId: number | null = null;
    let camId: number | null = null;
    let ox = 0, oy = 0, lx = 0, ly = 0;
    const ds = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        // World touches only: HUD buttons, DOM panels and overlays must never
        // capture the virtual joystick or camera (ghost movement / blocked
        // scrolling in puzzle and journal UI).
        if (!(t.target instanceof HTMLCanvasElement)) continue;
        if (t.clientX < innerWidth * JOY_ZONE && joyId === null) { joyId = t.identifier; ox = t.clientX; oy = t.clientY; stick(ox, oy, 0, 0, true); }
        else if (camId === null) { camId = t.identifier; lx = t.clientX; ly = t.clientY; }
      }
    };
    let consumed = false;
    const mv = (e: TouchEvent) => {
      consumed = false;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyId) {
          consumed = true;
          joyMove.x = Math.max(-1, Math.min(1, (t.clientX - ox) / 50));
          joyMove.z = Math.max(-1, Math.min(1, (t.clientY - oy) / 50));
          stick(ox, oy, joyMove.x * 28, joyMove.z * 28, true);
        } else if (t.identifier === camId) {
          consumed = true;
          camOrbit.yaw -= (t.clientX - lx) * 0.008;
          camOrbit.pitch = Math.max(0.12, Math.min(1.25, camOrbit.pitch + (t.clientY - ly) * 0.006));
          lx = t.clientX; ly = t.clientY;
        }
      }
      if (consumed && e.cancelable) e.preventDefault();
    };
    const up = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyId) { joyId = null; joyMove.x = 0; joyMove.z = 0; stick(0, 0, 0, 0, false); }
        if (t.identifier === camId) camId = null;
      }
    };
    // Bind on window, not the zone div: the zone is pointer-events:none, so
    // touch hit-testing never targets it and zone-level listeners never fire
    // (silent joystick death — camera-only movement bug). Button taps are
    // filtered by event target in `ds` instead.
    window.addEventListener('touchstart', ds, { passive: true });
    window.addEventListener('touchmove', mv, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('touchcancel', up);
    return () => { window.removeEventListener('touchstart', ds); window.removeEventListener('touchmove', mv); window.removeEventListener('touchend', up); window.removeEventListener('touchcancel', up); };
  }, []);

  return (
    <div id="touchzone" style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
      <div className="touch-ui touch-ui-left">
        <button className="touch-btn" aria-label="Jump" onTouchStart={() => { touchFlags.jump = true; }} onClick={() => { touchFlags.jump = true; }}>⤒</button>
        <button className="touch-btn" aria-label="Sprint toggle" onClick={() => { touchFlags.sprint = !touchFlags.sprint; }}>»</button>
      </div>
      <div className="touch-ui touch-ui-right">
        <button className="touch-btn" aria-label="Spirit ability" onClick={onInteract}>✦</button>
        <button className="touch-btn" aria-label="Interact" onClick={onInteract}>E</button>
      </div>
      <div ref={baseRef} aria-hidden style={{ display: 'none', position: 'fixed', width: 100, height: 100, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
      <div ref={knobRef} aria-hidden style={{ display: 'none', position: 'fixed', left: 0, top: 0, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
    </div>
  );
}
