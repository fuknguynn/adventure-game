import { describe, it, expect } from 'vitest';
import { nextLocomotionState, locoTimeScale } from './locomotion';

describe('locomotion state machine', () => {
  it('idle ↔ walk', () => {
    expect(nextLocomotionState('idle', 0, true)).toBe('idle');
    expect(nextLocomotionState('idle', 3, true)).toBe('walk');
    expect(nextLocomotionState('walk', 0.2, true)).toBe('idle');
  });
  it('walk ↔ run with hysteresis (no flapping at the boundary)', () => {
    expect(nextLocomotionState('walk', 6, true)).toBe('run');
    expect(nextLocomotionState('run', 5, true)).toBe('run');
    expect(nextLocomotionState('run', 4, true)).toBe('walk');
  });
  it('any grounded state → jump when airborne; jump → ground on landing', () => {
    expect(nextLocomotionState('run', 7, false)).toBe('jump');
    expect(nextLocomotionState('jump', 0, true)).toBe('idle');
    expect(nextLocomotionState('jump', 3, true)).toBe('walk');
    expect(nextLocomotionState('jump', 7, true)).toBe('run');
  });
  it('timeScale tracks speed and clamps', () => {
    expect(locoTimeScale('walk', 4.2)).toBeCloseTo(1);
    expect(locoTimeScale('run', 7.5)).toBeCloseTo(1);
    expect(locoTimeScale('walk', 0)).toBe(0.7);
    expect(locoTimeScale('idle', 0)).toBe(1);
  });
});
