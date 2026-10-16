import { useEffect, useRef } from 'react';
import { joyMove, touchFlags, camOrbit, JOY_ZONE, pausedFlag } from '../game/input';
import { useT } from '../i18n';

export function TouchControls({ onInteract }: { onInteract: () => void }) {
  const t = useT();
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let joyId: number | null = null;
    let camId: number | null = null;
    let lx = 0, ly = 0;
    let cx = 0, cy = 0;
    const stick = (dx: number, dy: number) => {
      const k = knobRef.current;
      if (!k || !cx || !cy) return;
      k.style.transform = `translate(${cx - 22 + dx * 28}px, ${cy - 22 + dy * 28}px)`;
    };
    const cacheCenter = () => {
      const b = baseRef.current;
      if (!b) return;
      const r = b.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    };
    const rs = () => { cacheCenter(); if (joyId === null) stick(0, 0); };
    const ds = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        // World touches only: HUD buttons, DOM panels and overlays must never
        // capture the virtual joystick or camera (ghost movement / blocked
        // scrolling in puzzle and journal UI).
        if (!(t.target instanceof HTMLCanvasElement)) continue;
        if (t.clientX < innerWidth * JOY_ZONE && joyId === null) {
          joyId = t.identifier;
          cacheCenter();
          stick(0, 0);
        } else if (camId === null) { camId = t.identifier; lx = t.clientX; ly = t.clientY; }
      }
    };
    let consumed = false;
    const mv = (e: TouchEvent) => {
      consumed = false;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyId) {
          consumed = true;
          // Paused: don't feed shared input (Player.tsx also gates; touchend
          // below always resets, so no stale joystick value survives).
          if (pausedFlag.v) break;
          joyMove.x = Math.max(-1, Math.min(1, (t.clientX - cx) / 50));
          joyMove.z = Math.max(-1, Math.min(1, (t.clientY - cy) / 50));
          stick(joyMove.x, joyMove.z);
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
        if (t.identifier === joyId) { joyId = null; joyMove.x = 0; joyMove.z = 0; stick(0, 0); }
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
    window.addEventListener('resize', rs);
    cacheCenter();
    stick(0, 0);
    return () => {
      window.removeEventListener('touchstart', ds);
      window.removeEventListener('touchmove', mv);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', up);
      window.removeEventListener('resize', rs);
    };
  }, []);

  return (
    <div id="touchzone" style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
      <div className="touch-ui touch-ui-left">
        <button className="touch-btn" aria-label={t('touch.jump')} onTouchStart={() => { if (!pausedFlag.v) touchFlags.jump = true; }} onClick={() => { if (!pausedFlag.v) touchFlags.jump = true; }}>⤒</button>
        <button className="touch-btn" aria-label={t('touch.sprint')} onClick={() => { touchFlags.sprint = !touchFlags.sprint; }}>»</button>
      </div>
      <div className="touch-ui touch-ui-right">
        <button className="touch-btn" aria-label={t('touch.ability')} onClick={onInteract}>✦</button>
        <button className="touch-btn" aria-label={t('touch.interact')} onClick={onInteract}>E</button>
      </div>
      <div ref={baseRef} className="touch-stick" aria-hidden />
      <div ref={knobRef} className="touch-knob" aria-hidden />
    </div>
  );
}
