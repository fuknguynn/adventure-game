/** Deterministic sequence-puzzle core shared by Spirit Path + Rune Sequence. */
export interface SequenceState {
  target: number[];
  input: number[];
  solved: boolean;
  mistakes: number;
}

export function createSequence(target: number[]): SequenceState {
  return { target: [...target], input: [], solved: false, mistakes: 0 };
}

/** Returns new state; wrong tap clears input and counts a mistake (clear reset, replayable). */
export function tapSequence(s: SequenceState, id: number): SequenceState {
  if (s.solved) return s;
  const next = [...s.input, id];
  const idx = next.length - 1;
  if (next[idx] !== s.target[idx]) {
    return { ...s, input: [], mistakes: s.mistakes + 1 };
  }
  if (next.length === s.target.length) return { ...s, input: next, solved: true };
  return { ...s, input: next };
}

export function resetSequence(s: SequenceState): SequenceState {
  return { ...s, input: [], solved: false };
}

/** Light Reflection: dials must equal targets. */
export function isBeamAligned(dials: number[], targets: number[]): boolean {
  return dials.length === targets.length && dials.every((d, i) => d === targets[i]);
}
