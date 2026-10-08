/** Shared mutable input (no React re-render per frame). */
export const keys = { fwd: false, back: false, left: false, right: false, sprint: false };
export const joyMove = { x: 0, z: 0 }; // -1..1
export const camOrbit = { yaw: 0.6, pitch: 0.35 };
export const touchFlags = { jump: false, interact: false, sprint: false };

export function attachKeyboard() {
  const down = (e: KeyboardEvent) => {
    if (e.repeat) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': keys.fwd = true; break;
      case 'KeyS': case 'ArrowDown': keys.back = true; break;
      case 'KeyA': case 'ArrowLeft': keys.left = true; break;
      case 'KeyD': case 'ArrowRight': keys.right = true; break;
      case 'ShiftLeft': case 'ShiftRight': keys.sprint = true; break;
      case 'Space': touchFlags.jump = true; e.preventDefault(); break;
      case 'KeyE': touchFlags.interact = true; break;
    }
  };
  const up = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': keys.fwd = false; break;
      case 'KeyS': case 'ArrowDown': keys.back = false; break;
      case 'KeyA': case 'ArrowLeft': keys.left = false; break;
      case 'KeyD': case 'ArrowRight': keys.right = false; break;
      case 'ShiftLeft': case 'ShiftRight': keys.sprint = false; break;
    }
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
}
