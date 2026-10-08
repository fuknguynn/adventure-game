# Eldergrove Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship playable Eldergrove vertical slice → full world on Vercel static hosting using only verified KayKit assets.

**Architecture:** Vite React-TS SPA; R3F world isolated from React state; Zustand for profile/progress/settings; Rapier physics; vendored KayKit GLB/glTF under `public/`; Web Audio synth; localStorage save.

**Tech Stack:** Vite 5, React 18, TypeScript strict, three + @react-three/fiber + @react-three/drei, @react-three/rapier, zustand, vitest.

**Spec:** `FANTASY_FOREST_MASTER_SPEC.md`; design `docs/superpowers/specs/2026-10-08-eldergrove-design.md`; audit `docs/ASSET_AUDIT.md`; manifest `asset-manifest.json`.

## Global Constraints

- Only verified KayKit assets from the three GeorgeQLe repos; every vendored file gets an `asset-manifest.json` entry with license CC0-1.0.
- No Quaternius/Kenney/itch.io/blocked-site fetches without approval; GitHub HTTPS only.
- Character choice cosmetic only; no class stats.
- Display name trimmed 1–20 chars, Unicode letters allowed, reject blank/controls, escape on render.
- Save key `eldergrove.save.v1`, schemaVersion 1, validation + migration + corrupted-save recovery + explicit reset confirmation.
- Static deploy only: `npm run build`, `dist`, no server/DB/auth/AI/paid services.
- No fake primitive scenery; invisible colliders only.
- Never claim tests/deploy done unless verified.

## Review Focus

- Long Unicode/display names render safely without HTML injection — expect escaped text everywhere.
- Corrupted localStorage JSON recovers to Welcome without crash — expect graceful reset.
- Missing/failed GLB fetch shows retry UI, never blank canvas — expect error state per asset.
- WebGL-unavailable browser shows message, never frozen loader — expect fallback screen.
- Rapid pause/resume and reload mid-puzzle preserve deterministic solved state — expect no unwinnable state.

---

### Task 1: Scaffold + vendor pipeline + licenses

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/app/ErrorBoundary.tsx`, `scripts/vendor-assets.mjs`, `public/licenses/KayKit-CC0-License.txt` (done), `vercel.json`
- Modify: `asset-manifest.json` (append vendored env/props by script)
- Test: `scripts/vendor-assets.mjs` run output

**Interfaces:**
- Consumes: upstream raw GitHub URLs, `asset-manifest.json` seed entries.
- Produces: `public/models/characters/*.glb`, `public/models/env/*`, `public/models/props/*`, runnable `npm run dev/build`.

- [ ] **Step 1: Scaffold Vite React-TS app (no git commit yet)**
- [ ] **Step 2: Install pinned deps (three, @react-three/fiber, @react-three/drei, @react-three/rapier, zustand) + dev (vitest, @types/three)**
- [ ] **Step 3: Write `scripts/vendor-assets.mjs`** — downloads Knight/Mage/Rogue GLBs + curated forest/prop glTF+bin set, writes manifest entries, skips existing.
- [ ] **Step 4: Run vendor script, verify files on disk + `npm run build` passes**
- [ ] **Step 5: Commit** — `feat: scaffold + vendor verified KayKit assets`

### Task 2: Save system + validation + stores (TDD)

**Files:**
- Create: `src/utils/saveSchema.ts`, `src/systems/SaveSystem.ts`, `src/stores/profileStore.ts`, `src/stores/progressStore.ts`, `src/stores/settingsStore.ts`, `src/utils/validateName.ts`
- Test: `src/utils/saveSchema.test.ts`, `src/utils/validateName.test.ts`

**Interfaces:**
- Consumes: localStorage key `eldergrove.save.v1`.
- Produces: `loadSave(): SaveData|null`, `writeSave(d)`, `resetSave()`, `isValidDisplayName(n: string): boolean`, Zustand hooks `useProfile`, `useProgress`, `useSettings`.

- [ ] **Step 1: Write failing tests** for name rules (blank reject, >20 reject, controls reject, Unicode accept, trim) + save round-trip/corrupt-recovery/migration.
- [ ] **Step 2: Run vitest, confirm failures**
- [ ] **Step 3: Implement validators + SaveSystem + stores**
- [ ] **Step 4: Run vitest, confirm pass**
- [ ] **Step 5: Commit** — `feat: save system + name validation + stores`

### Task 3: Onboarding (Welcome → Creation → Cinematic) with real 3D previews

**Files:**
- Create: `src/ui/Welcome.tsx`, `src/ui/CharacterCreation.tsx`, `src/ui/Loading.tsx`, `src/game/CharacterPreview.tsx`, `src/data/characters.ts`, `src/app/Routes.tsx` (state machine)
- Test: manual smoke (preview loads real GLB, rotate works, Enter disabled until valid)

**Interfaces:**
- Consumes: `useProfile`, `isValidDisplayName`, `/models/characters/*.glb`.
- Produces: game-state transitions `BOOT→PRELOAD→WELCOME→CREATION→CINEMATIC→PLAYING`, persisted profile.

- [ ] **Step 1: Implement data + preview + screens + routing**
- [ ] **Step 2: Verify dev-server smoke (3 previews render, validation gates entry)**
- [ ] **Step 3: Commit** — `feat: onboarding with verified 3D characters`

### Task 4: World vertical slice (Trail + Village + Grove, controller, camera, NPC, spirit)

**Files:**
- Create: `src/game/GameCanvas.tsx`, `src/game/World.tsx`, `src/game/PlayerController.tsx`, `src/game/ThirdPersonCamera.tsx`, `src/regions/{Trail,Village,MushroomGrove}.tsx`, `src/entities/{NPC,SpiritCompanion,Interactable}.tsx`, `src/systems/{InteractionSystem,AudioSystem,QualityManager}.tsx`, `src/ui/HUD.tsx`
- Test: smoke (WASD+mouse, joystick on mobile, collision holds, no fall-through)

**Interfaces:**
- Consumes: vendored env/props, `useProgress`, player profile characterId.
- Produces: traversable hub-and-spoke slice, E-interact, spirit follow FSM, checkpoint autosave.

- [ ] **Step 1: Implement canvas/world/player/camera/regions/entities**
- [ ] **Step 2: Smoke-test movement/collision/interact on desktop + mobile viewport**
- [ ] **Step 3: Commit** — `feat: vertical slice world + controller + companions`

### Task 5: Quests + puzzles (Spirit Path first, then Rune + Light) + transformation + ending

**Files:**
- Create: `src/systems/{QuestSystem,PuzzleSystem}.ts`, `src/puzzles/{SpiritPath,RuneSequence,LightReflection}.tsx`, `src/data/{quests,regions,interactables}.ts`, `src/ui/{Dialogue,QuestJournal,Map,Ending}.tsx`
- Test: `src/systems/puzzle.test.ts` (sequence success/reset/replay determinism, solved persists)

**Interfaces:**
- Consumes: `useProgress` (completedQuests, solvedPuzzles, spiritFragments, worldRestored).
- Produces: main quest `The Forest Remembers`, 3 fragments, restoration transform + finale, journal/tracker.

- [ ] **Step 1: Write failing puzzle tests**
- [ ] **Step 2: Implement quest/puzzle systems + UIs + world-state transform**
- [ ] **Step 3: Run tests + end-to-end quest smoke (accept→solve→fragment→save→reload persists)**
- [ ] **Step 4: Commit** — `feat: quests + puzzles + restoration`

### Task 6: Polish + release (day/night, particles, photo, settings, docs, deploy)

**Files:**
- Create: `src/ui/{Pause,Settings,PhotoMode}.tsx`, `src/game/DayNight.tsx`, `docs/{ARCHITECTURE,TEST_PLAN,DEPLOYMENT,KNOWN_LIMITATIONS}.md`, `vercel.json`
- Test: `npm run build`, `tsc --noEmit`, vitest, production preview smoke

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified `dist/`, docs, deployment-ready repo.

- [ ] **Step 1: Implement polish systems + docs**
- [ ] **Step 2: Run full verification (build, tests, smoke, size check)**
- [ ] **Step 3: Commit** — `release: polish + docs`
