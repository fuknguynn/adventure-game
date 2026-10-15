import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { Player, GroundBounds, playerPos } from './Player';
import { CameraRig } from './CameraRig';
import { Regions } from '../regions/Regions';
import { LAMP_LIGHTS } from '../regions/villageLayout';
import { Spirit, NPC } from '../entities/Actors';
import { Population } from '../entities/Population';
import { DepthDirector } from '../systems/DepthDirector';
import { MiniObjectiveMarkers, Interactables, Secrets, LoreFragments } from '../entities/DepthMarkers';
import { POPULATION } from '../regions/population';
import { TouchControls } from './TouchControls';
import { PuzzlePanels } from '../puzzles/PuzzlePanels';
import { HUD, DialogueView, JournalView, MapView, PauseView } from '../ui/HudScreens';
import { useProgress, useSettings } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { MAIN_NPC_DIALOGUE, REGION_TITLES, MINI_OBJECTIVES, INTERACTABLES } from '../data/depthData';
import { attachKeyboard, pausedFlag } from './input';
import { useEffect } from 'react';
import { sfx, setRegion, regionAt, updateListener, addPositionalSource, removePositionalSource } from '../systems/AudioSystem';

export const SPOTS = {
  spirit: new THREE.Vector3(2, 0, 2),
  grove: new THREE.Vector3(28, 0, -22),
  lake: new THREE.Vector3(-28, 0, 6),
  ruins: new THREE.Vector3(31, 0, 5),
  tree: new THREE.Vector3(0, 0, 31),
  npc: new THREE.Vector3(-3, 0, 0),
};

export function GameCanvas({ onExit, onEnding }: { onExit: () => void; onEnding: () => void }) {
  const { solvedPuzzles, completedQuests, spiritFragments, worldRestored, miniObjectives, setProgress, setNpcDialogueStage } = useProgress();
  const { setDialogue, setToast, photoMode, setPhotoMode } = useUI();
  const { quality, reducedMotion } = useSettings();
  const [puzzle, setPuzzle] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [dayT, setDayT] = useState(0.28);
  const [near, setNear] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(() => {
    try { return !localStorage.getItem('eldergrove.hintSeen'); } catch { return true; }
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => attachKeyboard(), []);
  useEffect(() => { pausedFlag.v = paused; return () => { pausedFlag.v = false; }; }, [paused]);

  // Celebrate pulse: timestamp updated when a puzzle is solved. PuzzlePanels
  // fires the 'recovered' toast on solve, so the re-render it triggers runs
  // this effect before the new celebratePulse prop reaches <Spirit/>.
  const celebrateRef = useRef(0);
  const prevSolved = useRef(solvedPuzzles.length);
  useEffect(() => {
    if (solvedPuzzles.length > prevSolved.current) celebrateRef.current = performance.now() / 1000;
    prevSolved.current = solvedPuzzles.length;
  }, [solvedPuzzles.length]);
  // Contextual prompt: label of whatever is in interact range (same radii as interact())
  useEffect(() => {
    const R = (v: THREE.Vector3, r = 4.5) => playerPos.distanceTo(new THREE.Vector3(v.x, playerPos.y, v.z)) < r;
    let raf = 0, last = '';
    const tick = () => {
      const popLabel = POPULATION.find((e) => e.interactable && e.label && R(new THREE.Vector3(...e.position)))?.label ?? '';
      const spotLabel =
        R(SPOTS.npc) || R(SPOTS.spirit) ? 'Talk' :
        R(SPOTS.grove, 5) || R(SPOTS.lake, 6) || R(SPOTS.ruins, 5) ? 'Inspect' :
        R(SPOTS.tree, 6) ? 'Touch the Tree' :
        '';
      // SPOTS win, then population, then interactables (same order as interact()).
      const label = spotLabel ||
        popLabel ||
        (INTERACTABLES.find((i) => R(new THREE.Vector3(...i.position), 3))?.label ?? '');
      if (label !== last) { last = label; setNear(label || null); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => {
      setShowHint(false);
      try { localStorage.setItem('eldergrove.hintSeen', '1'); } catch { /* private mode */ }
    }, 7000);
    return () => clearTimeout(t);
  }, [showHint]);
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setDayT((t) => (t + 0.004) % 1), 500);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const guideTarget = useMemo(() => {
    if (solvedPuzzles.includes('spirit_path') && !solvedPuzzles.includes('rune_sequence')) return SPOTS.lake;
    if (solvedPuzzles.length === 0) return SPOTS.grove;
    if (solvedPuzzles.length === 1) return SPOTS.lake;
    if (solvedPuzzles.length === 2) return SPOTS.ruins;
    return SPOTS.tree;
  }, [solvedPuzzles]);

  // Spirit hint: position of the active region's mini-objective (first step —
  // the Spirit points at the objective area, not a specific step). Null when
  // no objective is active or it is already complete / the puzzle is solved.
  const spiritHint = useMemo(() => {
    const region = regionAt(playerPos.x, playerPos.z);
    const obj = MINI_OBJECTIVES.find((o) => o.region === region && !miniObjectives.includes(o.id) && !solvedPuzzles.includes(o.reward.puzzleId));
    return obj ? new THREE.Vector3(...obj.steps[0].position) : null;
  }, [miniObjectives, solvedPuzzles]);

  const spiritHintDone = useMemo(() => {
    const region = regionAt(playerPos.x, playerPos.z);
    const obj = MINI_OBJECTIVES.find((o) => o.region === region);
    if (!obj) return false;
    return miniObjectives.includes(obj.id) || solvedPuzzles.includes(obj.reward.puzzleId);
  }, [miniObjectives, solvedPuzzles]);

  const interact = useCallback(() => {
    if (paused || puzzle) return;
    const near = (v: THREE.Vector3, r = 4.5) => playerPos.distanceTo(new THREE.Vector3(v.x, playerPos.y, v.z)) < r;
    sfx.interact();
    if (near(SPOTS.npc) || near(SPOTS.spirit)) {
      sfx.shrineInteract();
      // Stage is derived from progress (fragment count, or 4 after the
      // ending) — not a one-shot counter. Persist so save/load is stable.
      const stage = worldRestored ? 4 : Math.min(3, spiritFragments);
      setDialogue(MAIN_NPC_DIALOGUE[stage]);
      setNpcDialogueStage(stage);
      if (!completedQuests.includes('met_spirit')) setProgress({ completedQuests: [...completedQuests, 'met_spirit'] });
      return;
    }
    // Already-solved spots never reopen: PuzzlePanels fires sfx.fragment +
    // 'recovered' toast on every in-panel solve, so re-opening a solved puzzle
    // would replay the reward. Inspecting shows a calm confirmation instead.
    const openPuzzle = (id: string, name: string) => {
      if (solvedPuzzles.includes(id)) {
        setToast(`${name} fragment already recovered ✦`);
        setTimeout(() => setToast(null), 2000);
        return;
      }
      setPuzzle(id);
    };
    // Mini-objectives gate ACCESS, not solving: the puzzle only opens once the
    // region's objective is complete (DepthDirector completes it via proximity).
    const gated = (id: string, name: string, objectiveId: string) => {
      if (!miniObjectives.includes(objectiveId)) {
        setToast('The Spirit hasn\'t revealed the puzzle yet. Follow the trail ✦');
        setTimeout(() => setToast(null), 2400);
        return;
      }
      openPuzzle(id, name);
    };
    if (near(SPOTS.grove, 5)) { gated('spirit_path', 'Grove', 'grove_trail'); return; }
    if (near(SPOTS.lake, 6)) { gated('rune_sequence', 'Lake', 'lake_crystals'); return; }
    if (near(SPOTS.ruins, 5)) { gated('light_reflection', 'Ruins', 'ruins_runes'); return; }
    if (near(SPOTS.tree, 6)) {
      if (solvedPuzzles.length >= 3) {
        // Reward fires once: re-touching after completion must not replay SFX/ending.
        if (!completedQuests.includes('the_forest_remembers')) {
          // Guarded by `!includes` above: plain append cannot duplicate.
          setProgress({ worldRestored: true, completedQuests: [...completedQuests, 'the_forest_remembers'] });
          sfx.fragment();
          sfx.treeRestore();
          onEnding();
        } else {
          setToast('The restored grove hums with light ✦');
          setTimeout(() => setToast(null), 2200);
        }
      } else {
        setToast(`The Tree sleeps. Fragments: ${solvedPuzzles.length}/3`);
        setTimeout(() => setToast(null), 2200);
      }
      return;
    }
    // Population NPCs (SPOTS checks above win): distance-based, no colliders.
    for (const e of POPULATION) {
      if (!e.interactable || !e.dialogue) continue;
      if (near(new THREE.Vector3(...e.position))) {
        sfx.shrineInteract();
        setDialogue(e.dialogue);
        return;
      }
    }
    // Environmental interactables (SPOTS + population win): repeatable flavor.
    for (const i of INTERACTABLES) {
      if (near(new THREE.Vector3(...i.position), 3)) {
        sfx.shrineInteract();
        setDialogue(i.text);
        return;
      }
    }
    setToast('Nothing here — follow the spirit light ✦');
    setTimeout(() => setToast(null), 1500);
  }, [paused, puzzle, completedQuests, solvedPuzzles, spiritFragments, worldRestored, miniObjectives, setDialogue, setProgress, setNpcDialogueStage, setToast, onEnding]);

  const dpr = quality === 'low' ? 0.75 : quality === 'high' ? 2 : 1.25;
  const shadowSize = quality === 'low' ? 512 : quality === 'high' ? 2048 : 1024;
  const sun = useMemo(() => {
    // dayT 0.5 = noon: daylight peaks at 1, night floors at 0
    const daylight = Math.max(0, Math.sin((dayT - 0.25) * Math.PI * 2));
    const isDay = daylight > 0.02;
    // Dark-fantasy grade: warm amber key, deeper dusk-leaning fog/background.
    return {
      daylight, isDay,
      intensity: 0.32 + daylight * 2.35,
      color: isDay ? '#ffd9a0' : '#9db8ff',
      fog: isDay ? '#274430' : '#0b151d',
    };
  }, [dayT]);

  return (
    <div style={{ height: '100vh', position: 'relative' }} onContextMenu={(e) => e.preventDefault()}>
      {!photoMode && <HUD onPause={() => setPaused(true)} />}
      <DialogueView />
      <JournalView />
      <MapView />
      {paused && <PauseView onResume={() => setPaused(false)} onQuit={onExit} />}
      <PuzzlePanels active={puzzle} onClose={() => setPuzzle(null)} />
      {photoMode && (
        <div className="hud photo-bar">
          <span className="chip">Photo mode — HUD hidden</span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => {
              const c = document.querySelector('canvas');
              if (c) { const a = document.createElement('a'); a.download = 'eldergrove.png'; a.href = c.toDataURL('image/png'); a.click(); }
            }}>Save shot</button>
            <button onClick={() => setPhotoMode(false)}>Exit</button>
          </span>
        </div>
      )}
      {!photoMode && showHint && (
        <div className="hud kb-hint">
          <span className="chip">WASD Move · Mouse Look · Space Jump · E Interact</span>
        </div>
      )}
      {!photoMode && near && !paused && !puzzle && (
        <div className="hud interact-prompt" role="status"><span className="key">E</span> {near}</div>
      )}
      <Canvas ref={canvasRef} shadows dpr={dpr} gl={{ preserveDrawingBuffer: true, antialias: true }} camera={{ fov: 55, near: 0.1, far: 220 }} style={{ touchAction: 'none' }}>
        <color attach="background" args={[sun.fog]} />
        <fog attach="fog" args={[sun.fog, 24, 85]} />
        {/* layered light: cool ambient fill + warm key + cool rim */}
        <ambientLight intensity={0.26 + sun.daylight * 0.55} color={sun.isDay ? '#bedce4' : '#7f9fb8'} />
        <hemisphereLight args={[sun.isDay ? '#b6d6e6' : '#8fb6d8', '#26331e', 0.32 + sun.daylight * 0.5]} />
        <directionalLight position={[18, 26, 10]} intensity={sun.intensity} color={sun.color} castShadow
          shadow-mapSize={shadowSize} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-bias={-0.0004} />
        <directionalLight position={[-15, 8, -12]} intensity={0.35} color="#8fd0d8" />
        {LAMP_LIGHTS.map((p, i) => (
          <pointLight key={`lamp${i}`} position={p} color="#ffce7d" intensity={sun.isDay ? 3 : 14} distance={9} decay={2} />
        ))}
        <Suspense fallback={null}>
          <Physics gravity={[0, -18, 0]} timeStep={1 / 60}>
            <GroundBounds />
            <Player onInteract={interact} />
            <Regions />
          </Physics>
          <NPC position={[-3, 0, 0]} onTalk={interact} />
          <Spirit guideTarget={guideTarget} hintTarget={spiritHint} hintDone={spiritHintDone} celebratePulse={celebrateRef.current} worldLevel={Math.min(3, spiritFragments)} />
          <Population />
          <DepthDirector />
          <MiniObjectiveMarkers />
          <Interactables />
          <Secrets />
          <LoreFragments />
          <Marker pos={SPOTS.grove} label="?" />
          <Marker pos={SPOTS.lake} label="?" />
          <Marker pos={SPOTS.ruins} label="?" />
          <Marker pos={SPOTS.tree} label="★" big />
        </Suspense>
        <CameraRig />
        <AudioDirector />
      </Canvas>
      <TouchControls onInteract={interact} />
      {!photoMode && (
        <div className="hud day-slider">
          <input aria-label="Time of day" type="range" min={0} max={1} step={0.01} value={dayT} onChange={(e) => setDayT(Number(e.target.value))} style={{ width: 110 }} />
        </div>
      )}
    </div>
  );
}

function Marker({ pos, label, big }: { pos: THREE.Vector3; label: string; big?: boolean }) {
  return (
    <group position={[pos.x, big ? 2.6 : 1.8, pos.z]}>
      <mesh>
        <torusGeometry args={[big ? 0.5 : 0.34, 0.05, 10, 24]} />
        <meshBasicMaterial color="#d8bb78" />
      </mesh>
    </group>
  );
  void label;
}

// Session-scoped region-title toast dedup: each region toasts at most once.
const TOASTED_REGIONS = new Set<string>();

/** Per-frame audio director: region detection, listener update, positional sources. */
function AudioDirector() {
  const lastRegion = useRef<string>('');
  const activePositionals = useRef<Record<string, boolean>>({});
  const forward = useRef(new THREE.Vector3(0, 0, -1));

  // Landmark positional sources: id, position, kind, radius
  const LANDMARKS: Array<{ id: string; pos: [number, number, number]; kind: 'shrine' | 'tree' | 'lake' | 'ruins'; radius: number }> = [
    { id: 'shrine_spirit', pos: [2, 1.5, 2], kind: 'shrine', radius: 12 },
    { id: 'tree_ancient', pos: [0, 3, 34], kind: 'tree', radius: 14 },
    { id: 'lake_water', pos: [-29, 0.5, 6], kind: 'lake', radius: 12 },
    { id: 'ruins_stone', pos: [31, 1, 5], kind: 'ruins', radius: 12 },
  ];

  useFrame((state) => {
    const p = playerPos;
    // Update listener position + forward (camera look direction)
    const cam = state.camera;
    forward.current.set(0, 0, -1).applyQuaternion(cam.quaternion);
    updateListener(
      { x: p.x, y: p.y, z: p.z },
      { x: forward.current.x, y: forward.current.y, z: forward.current.z },
    );

    // Region detection (throttled: only when region actually changes)
    const region = regionAt(p.x, p.z);
    if (region !== lastRegion.current) {
      lastRegion.current = region;
      setRegion(region);
      // Subtle region-entry feedback: one toast per region per session.
      const title = REGION_TITLES[region];
      if (title && !TOASTED_REGIONS.has(region)) {
        TOASTED_REGIONS.add(region);
        const ui = useUI.getState();
        ui.setToast(title);
        setTimeout(() => useUI.getState().setToast(null), 2000);
      }
    }

    // Positional sources: add when in range, remove when out
    for (const lm of LANDMARKS) {
      const d = Math.hypot(p.x - lm.pos[0], p.z - lm.pos[2]);
      const inRange = d < lm.radius;
      const active = !!activePositionals.current[lm.id];
      if (inRange && !active) {
        const id = addPositionalSource(lm.id, lm.pos, lm.kind, 0.4);
        if (id) activePositionals.current[id] = true;
      } else if (!inRange && active) {
        removePositionalSource(lm.id);
        delete activePositionals.current[lm.id];
      }
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const id of Object.keys(activePositionals.current)) removePositionalSource(id);
      activePositionals.current = {};
    };
  }, []);

  return null;
}
