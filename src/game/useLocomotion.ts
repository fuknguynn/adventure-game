import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';
import { loco, nextLocomotionState, locoTimeScale, type LocoState } from './locomotion';

const ANIM_GENERAL = '/models/anim/Rig_Medium_General.glb';
const ANIM_MOVE = '/models/anim/Rig_Medium_MovementBasic.glb';
const FADE = 0.22;

/**
 * Retargets verified KayKit Rig_Medium clips onto the player's cloned scene.
 * Bone names match exactly (23/23, audited); clips are in-place so the mesh
 * never translates — Rapier stays authoritative. Exposes current state for tests.
 */
export function useLocomotion(model: THREE.Object3D | null) {
  const gen = useLoader(GLTFLoader, ANIM_GENERAL);
  const mov = useLoader(GLTFLoader, ANIM_MOVE);
  const state = useRef<LocoState>('idle');
  const current = useRef<THREE.AnimationAction | null>(null);

  const rig = useMemo(() => {
    if (!model) return null;
    const mixer = new THREE.AnimationMixer(model);
    const clips = [...gen.animations, ...mov.animations];
    const get = (name: string) => {
      const c = THREE.AnimationClip.findByName(clips, name);
      if (!c) {
        console.warn(`[Eldergrove] animation clip missing: ${name}`);
        return null;
      }
      return mixer.clipAction(c);
    };
    const actions = {
      idle: get('Idle_A'),
      walk: get('Walking_A'),
      run: get('Running_A'),
      jumpStart: get('Jump_Start'),
      jump: get('Jump_Idle'),
    };
    for (const [k, a] of Object.entries(actions)) {
      if (!a) continue;
      a.enabled = true;
      if (k === 'jumpStart') {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      } else {
        a.setLoop(THREE.LoopRepeat, Infinity);
      }
      (a as THREE.AnimationAction & { __name?: string }).__name = k;
    }
    const onFinished = (e: { action: THREE.AnimationAction }) => {
      if ((e.action as THREE.AnimationAction & { __name?: string }).__name === 'jumpStart' && state.current === 'jump') {
        current.current?.fadeOut(0.12);
        actions.jump?.reset().fadeIn(0.12).play();
        current.current = actions.jump ?? null;
      }
    };
    mixer.addEventListener('finished', onFinished);
    return { mixer, actions };
  }, [model, gen, mov]);

  // Lifecycle owns playback; cleanup only stops. Never uncache: the memoized
  // actions must survive StrictMode/HMR effect re-runs, and play() re-binds.
  useEffect(() => {
    if (!rig) return;
    current.current?.fadeOut(0.1);
    rig.actions.idle?.reset().fadeIn(FADE).play();
    current.current = rig.actions.idle ?? null;
    state.current = 'idle';
    return () => {
      rig.mixer.stopAllAction();
    };
  }, [rig]);

  useFrame((_, rawDt) => {
    if (!rig) return;
    const dt = Math.min(rawDt, 1 / 20); // clamp tab-switch spikes; no snapping
    const next = nextLocomotionState(state.current, loco.speed, loco.grounded);
    if (next !== state.current) {
      const { actions } = rig;
      current.current?.fadeOut(FADE);
      if (next === 'jump') {
        actions.jumpStart?.reset().setEffectiveTimeScale(1.25).fadeIn(0.12).play();
        current.current = actions.jumpStart ?? null;
      } else {
        const a = actions[next];
        a?.reset().setEffectiveTimeScale(locoTimeScale(next, loco.speed)).fadeIn(FADE).play();
        current.current = a ?? null;
      }
      state.current = next;
    } else if (next === 'walk' || next === 'run') {
      rig.actions[next]?.setEffectiveTimeScale(locoTimeScale(next, loco.speed));
    }
    rig.mixer.update(dt);
    debugLoco.state = state.current;
    debugLoco.speed = +loco.speed.toFixed(2);
    debugLoco.grounded = loco.grounded;
  });

  return state;
}

/** Mutable debug snapshot for headless verification (no React state). */
export const debugLoco = { state: 'idle' as LocoState, speed: 0, grounded: true };
