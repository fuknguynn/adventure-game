# Eldergrove Design (architectural path — condensed)

**Classification:** architectural (new project, no existing flow). User instruction overrides approval gates: spec is authoritative, build continuously.

**Understanding:** Build Eldergrove: The Lost Realm — stylized 3D forest adventure, hub-and-spoke miniature open world, name + 3 verified KayKit characters, spirit companion, 3 fragments via 3 puzzles, Ancient Tree restoration, local save, free Vercel static deploy. First deliver vertical slice (Spawn Gate + Village + Mushroom Grove + Spirit Path + 1 transformation), then expand.

**Approaches considered:**
1. (Recommended) Spec stack: Vite + React + TS + R3F + drei + Rapier + Zustand + Web Audio synth. Faithful, ecosystem helpers, static-deployable.
2. Vanilla three.js SPA: lighter, but more hand-rolled loader/camera/physics code; rejected (slower, diverges from spec).
3. Placeholder-primitive world: rejected explicitly by spec (no fake trees/scenery); only invisible colliders allowed.

**Design:**
- Architecture: static SPA; React for screens/state, R3F Canvas for world only; Zustand stores (profile/progress/settings/ui) never updated per-frame; game loop via useFrame + refs; Rapier for player collider + static colliders; GLTFLoader for vendored KayKit GLB/glTF.
- Components: screens (Welcome/Creation/Playing/HUD/Dialogue/Journal/Map/Pause/Settings/Photo/Ending) + 3D (World, PlayerController, ThirdPersonCamera, regions, NPC, SpiritCompanion, Interactable) + systems (Save, Quest, Puzzle, Audio-synth, Quality) + data (characters/regions/quests).
- Data flow: BOOT→PRELOAD→WELCOME→CREATION→CINEMATIC→PLAYING; profile/progress in `eldergrove.save.v1` localStorage, schemaVersion 1, validation + corrupted-save recovery; autosave on checkpoints.
- Error handling: Suspense + error boundaries; per-asset load error UI with retry; WebGL-fail message; safe name sanitization (escape, no HTML).
- Testing: Vitest for save validation, name validation, puzzle state machines; `npm run build` + tsc; browser smoke via dev server + production preview.
- Asset truth: Knight/Mage/Rogue GLBs vendored; environments as glTF+bin pairs (0 native GLB upstream); wildlife/audio gaps use particles + Web Audio synth (documented).

**Spec:** `FANTASY_FOREST_MASTER_SPEC.md` + `docs/ASSET_AUDIT.md`. Self-review: no TBD; cosmetic-only characters; no monetization; no backend.
