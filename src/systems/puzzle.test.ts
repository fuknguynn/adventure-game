import { describe, it, expect } from 'vitest';
import { createSequence, tapSequence, isBeamAligned } from './PuzzleSystem';

describe('sequence puzzles', () => {
  it('solves on exact order', () => {
    let s = createSequence([0, 2, 1, 3]);
    for (const t of [0, 2, 1, 3]) s = tapSequence(s, t);
    expect(s.solved).toBe(true);
  });
  it('resets clearly after a mistake and stays replayable', () => {
    let s = createSequence([0, 2, 1]);
    s = tapSequence(s, 0);
    s = tapSequence(s, 9);
    expect(s.solved).toBe(false);
    expect(s.input).toEqual([]);
    expect(s.mistakes).toBe(1);
    for (const t of [0, 2, 1]) s = tapSequence(s, t);
    expect(s.solved).toBe(true);
  });
  it('ignores taps after solved', () => {
    let s = createSequence([1]);
    s = tapSequence(s, 1);
    const again = tapSequence(s, 5);
    expect(again.solved).toBe(true);
  });
});

describe('light reflection', () => {
  it('aligns only on exact dials', () => {
    expect(isBeamAligned([1, 2, 0], [1, 2, 0])).toBe(true);
    expect(isBeamAligned([1, 2, 1], [1, 2, 0])).toBe(false);
  });
});
