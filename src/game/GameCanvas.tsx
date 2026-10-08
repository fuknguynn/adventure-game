import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { Player, GroundBounds, playerPos } from './Player';
import { CameraRig } from './CameraRig';
import { Regions } from '../regions/Regions';
import { LAMP_LIGHTS } from '../regions/villageLayout';
import { Spirit, NPC } from '../entities/Actors';
import { TouchControls } from './TouchControls';
import { PuzzlePanels } from '../puzzles/PuzzlePanels';
import { HUD, DialogueView, JournalView, MapView, PauseView } from '../ui/HudScreens';
import { useProgress, useSettings } from '../stores/stores';
import { useUI } from '../stores/uiStore';
import { attachKeyboard } from './input';
import { useEffect } from 'react';
import { sfx } from '../systems/AudioSystem';

export const SPOTS = {
  spirit: new THREE.Vector3(2, 0, 2),
  grove: new THREE.Vector3(28, 0, -22),
  lake: new THREE.Vector3(-28, 0, 6),
  ruins: new THREE.Vector3(31, 0, 5),
  tree: new THREE.Vector3(0, 0, 31),
  npc: new THREE.Vector3(-3, 0, 0),
};

export function GameCanvas({ onExit, onEnding }: { onExit: () => void; onEnding: () => void }) {
  const { solvedPuzzles, completedQuests, setProgress } = useProgress();
  const { setDialogue, setToast, photoMode, setPhotoMode } = useUI();
  const { quality, reducedMotion } = useSettings();
  const [puzzle, setPuzzle] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [dayT, setDayT] = useState(0.35);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => attachKeyboard(), []);
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

  const interact = useCallback(() => {
    if (paused || puzzle) return;
    const near = (v: THREE.Vector3, r = 4.5) => playerPos.distanceTo(new THREE.Vector3(v.x, playerPos.y, v.z)) < r;
    sfx.interact();
    if (near(SPOTS.npc) || near(SPOTS.spirit)) {
      setDialogue([
        'Elder Mira: “The Tree dreams, little spark. Three fragments scattered — grove, lake, ruins.”',
        'Spirit: “Follow my light. Step where I stepped.” (Quest updated: The Forest Remembers)',
      ]);
      if (!completedQuests.includes('met_spirit')) setProgress({ completedQuests: [...completedQuests, 'met_spirit'] });
      return;
    }
    if (near(SPOTS.grove, 5)) { setPuzzle('spirit_path'); return; }
    if (near(SPOTS.lake, 6)) { setPuzzle('rune_sequence'); return; }
    if (near(SPOTS.ruins, 5)) { setPuzzle('light_reflection'); return; }
    if (near(SPOTS.tree, 6)) {
      if (solvedPuzzles.length >= 3) {
        setProgress({ worldRestored: true, completedQuests: [...new Set([...completedQuests, 'the_forest_remembers'])] });
        sfx.fragment();
        onEnding();
      } else {
        setToast(`The Tree sleeps. Fragments: ${solvedPuzzles.length}/3`);
        setTimeout(() => setToast(null), 2200);
      }
      return;
    }
    setToast('Nothing here — follow the spirit light ✦');
    setTimeout(() => setToast(null), 1500);
  }, [paused, puzzle, completedQuests, solvedPuzzles, setDialogue, setProgress, setToast, onEnding]);

  const dpr = quality === 'low' ? 0.75 : quality === 'high' ? 2 : 1.25;
  const shadowSize = quality === 'low' ? 512 : quality === 'high' ? 2048 : 1024;
  const sun = useMemo(() => {
    // dayT 0.5 = noon: daylight peaks at 1, night floors at 0
    const daylight = Math.max(0, Math.sin((dayT - 0.25) * Math.PI * 2));
    const isDay = daylight > 0.02;
    return {
      daylight, isDay,
      intensity: 0.35 + daylight * 2.3,
      color: isDay ? '#fff2d0' : '#9db8ff',
      fog: isDay ? '#2e4d3a' : '#101c26',
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
        <div className="hud topbar">
          <span className="chip">Photo mode — HUD hidden</span>
          <span className="panel" style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => {
              const c = document.querySelector('canvas');
              if (c) { const a = document.createElement('a'); a.download = 'eldergrove.png'; a.href = c.toDataURL('image/png'); a.click(); }
            }}>Save shot</button>
            <button onClick={() => setPhotoMode(false)}>Exit</button>
          </span>
        </div>
      )}
      {!photoMode && (
        <div className="hud kb-hint">
          <span className="chip">WASD move · drag orbit · Space jump · E interact · M map</span>
        </div>
      )}
      <Canvas ref={canvasRef} shadows dpr={dpr} gl={{ preserveDrawingBuffer: true, antialias: true }} camera={{ fov: 55, near: 0.1, far: 220 }} style={{ touchAction: 'none' }}>
        <color attach="background" args={[sun.fog]} />
        <fog attach="fog" args={[sun.fog, 24, 85]} />
        {/* layered light: cool ambient fill + warm key + cool rim */}
        <ambientLight intensity={0.28 + sun.daylight * 0.55} color={sun.isDay ? '#c8dcec' : '#7f9fb8'} />
        <hemisphereLight args={[sun.isDay ? '#bcd9ea' : '#8fb6d8', '#2d3a22', 0.35 + sun.daylight * 0.5]} />
        <directionalLight position={[18, 26, 10]} intensity={sun.intensity} color={sun.color} castShadow
          shadow-mapSize={shadowSize} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-bias={-0.0004} />
        <directionalLight position={[-15, 8, -12]} intensity={0.35} color="#9fc4ff" />
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
          <Spirit guideTarget={guideTarget} />
          {/* interaction markers: shape-coded rings, never color-only */}
          <Marker pos={SPOTS.grove} label="?" />
          <Marker pos={SPOTS.lake} label="?" />
          <Marker pos={SPOTS.ruins} label="?" />
          <Marker pos={SPOTS.tree} label="★" big />
        </Suspense>
        <CameraRig />
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
