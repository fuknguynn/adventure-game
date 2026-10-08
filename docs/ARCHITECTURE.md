# Architecture

Static Vite + React 18 + TypeScript SPA. 3D via three / @react-three/fiber v8 / @react-three/drei v9 / @react-three/rapier v1. State via zustand (profile, progress, settings, UI). Audio synthesized with Web Audio (no files).

```
src/
  app/        App (phase machine), ErrorBoundary, styles
  game/       GameCanvas, Player (Rapier capsule + GLB), CameraRig, Model (KayKit loader), TouchControls, input (shared mutable)
  regions/    Regions (hub-and-spoke: village/trail/grove/lake/ruins/tree from vendored glTF)
  entities/   Actors (Spirit FSM, NPC)
  puzzles/    PuzzlePanels (DOM) — logic in systems/PuzzleSystem (tested)
  systems/    SaveSystem, PuzzleSystem, AudioSystem
  stores/     stores (profile/progress/settings), uiStore (phase/dialogue/journal/map/photo/toast)
  ui/         Onboarding (Welcome/Creation/Cinematic), HudScreens
  data/       gameData (verified character defs, quest, puzzle targets)
  utils/      saveSchema (v1 + migration), validateName
public/models/{characters,env,props}/  vendored KayKit (see asset-manifest.json)
```

Key decisions: React state never updates per-frame (refs + zustand transient); physics fixed step 1/60; characters are cloned GLTF scenes (no shared-mutation); glTF+bin pairs vendored for env/props (upstream has 0 native GLB); puzzles deterministic + DOM-accessible (shape+number, never color-only); save `eldergrove.save.v1` with validation/migration/recovery.
