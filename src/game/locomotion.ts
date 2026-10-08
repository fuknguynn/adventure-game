/** Locomotion signals + pure state machine. Physics (Rapier) writes `loco`;
 *  the animation mixer only reads. Animation never drives translation. */

export type LocoState = 'idle' | 'walk' | 'run' | 'jump';

/** Written every physics frame by Player; read by the mixer. No React state. */
export const loco = { speed: 0, grounded: true };

const RUN_ENTER = 5.2;
const RUN_KEEP = 4.4;
const WALK_ENTER = 0.6;

export function nextLocomotionState(prev: LocoState, speed: number, grounded: boolean): LocoState {
  if (!grounded) return 'jump';
  if (prev === 'run') {
    if (speed >= RUN_KEEP) return 'run';
    return speed > WALK_ENTER ? 'walk' : 'idle';
  }
  if (speed >= RUN_ENTER) return 'run';
  if (speed > WALK_ENTER) return 'walk';
  return 'idle';
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Match cycle rate to actual movement speed to avoid foot sliding. */
export function locoTimeScale(state: LocoState, speed: number): number {
  if (state === 'walk') return clamp(speed / 4.2, 0.7, 1.5);
  if (state === 'run') return clamp(speed / 7.5, 0.8, 1.4);
  return 1;
}
