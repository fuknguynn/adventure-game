// DepthDirector.tsx — single 10 Hz throttled proximity loop for exploration
// depth triggers: mini-objective step completion, secret discovery, lore
// collection. Region-filtered (only current region's entries), idempotent
// store writes (includes-guards), no per-frame React state.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { create } from 'zustand';
import { playerPos } from '../game/Player';
import { regionAt } from '../systems/AudioSystem';
import { useProgress } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { MINI_OBJECTIVES, SECRETS, LORE_FRAGMENTS } from '../data/depthData';

const TICK = 0.1; // 10 Hz

/** Reactive current region, written only on discrete region change. Depth
 *  markers subscribe to this so they re-render only when the region flips —
 *  never per-frame. */
export const useLiveRegion = create<{ region: string; setRegion: (r: string) => void }>((set) => ({
  region: 'village',
  setRegion: (region) => set((s) => (s.region === region ? s : { region })),
}));

export function DepthDirector() {
  const acc = useRef(0);
  // Refs for region-dwell / visited-step tracking (no per-frame React state).
  const lastRegion = useRef('');
  const visited = useRef(0);

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < TICK) return;
    acc.current = 0;

    const p = useProgress.getState();
    const ui = useUI.getState();
    const region = regionAt(playerPos.x, playerPos.z);
    const inRadius = (x: number, z: number, r: number) => (playerPos.x - x) ** 2 + (playerPos.z - z) ** 2 < r * r;
    const toast = (msg: string) => {
      ui.setToast(msg);
      setTimeout(() => useUI.getState().setToast(null), 2200);
    };

    // Reset step tracking + publish the live region when it changes.
    if (region !== lastRegion.current) {
      lastRegion.current = region;
      visited.current = 0;
      useLiveRegion.getState().setRegion(region);
    }

    // Mini-objective steps: all steps must be visited (any order); the
    // objective completes when the last unvisited step is reached.
    for (const obj of MINI_OBJECTIVES) {
      if (obj.region !== region || p.miniObjectives.includes(obj.id)) continue;
      if (p.solvedPuzzles.includes(obj.reward.puzzleId)) continue;
      for (let i = 0; i < obj.steps.length; i++) {
        if (visited.current & (1 << i)) continue;
        const s = obj.steps[i];
        if (inRadius(s.position[0], s.position[2], s.check.radius)) {
          visited.current |= 1 << i;
          if (visited.current === (1 << obj.steps.length) - 1) {
            p.completeMiniObjective(obj.id);
            toast(obj.reward.toast);
          }
        }
      }
      break;
    }

    // Secret discovery: proximity trigger, one-shot.
    for (const s of SECRETS) {
      if (s.region !== region || p.secrets.includes(s.id)) continue;
      if (!inRadius(s.position[0], s.position[2], s.trigger.radius)) continue;
      p.discoverSecret(s.id);
      if (s.reward.kind === 'lore' && s.reward.id) p.collectLore(s.reward.id);
      if (s.reward.kind === 'flag') {
        p.setProgress({ completedQuests: p.completedQuests.includes('secret_' + s.id) ? p.completedQuests : [...p.completedQuests, 'secret_' + s.id] });
      }
      toast(`${s.label}: ${s.reward.text}`);
    }

    // Lore collection: proximity, one-shot.
    for (const l of LORE_FRAGMENTS) {
      if (l.region !== region || p.lore.includes(l.id)) continue;
      if (!inRadius(l.position[0], l.position[2], 3)) continue;
      p.collectLore(l.id);
      toast(l.title);
    }
  });

  return null;
}
