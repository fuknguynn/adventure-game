# Gameplay Depth Production Pass — Architecture

Design for adding exploration depth to Eldergrove: progress-based NPC dialogue,
mini-objectives before each puzzle, a smarter Spirit companion, environmental
storytelling, secrets, lore, and world reaction to fragment progress.

**Scope rules (hard):** no combat, no environment redesign, no puzzle-system
replacement, no save/progression break, no large RPG systems. Target: 15–30 min
of meaningful exploration. Everything is data-driven, lightweight, and
exploration-driven.

## 0. Current state (what this builds on)

- `Progress` store (`src/stores/stores.ts`): `regionId`, `spawnId`,
  `completedQuests: string[]`, `solvedPuzzles: string[]`, `spiritFragments: number`,
  `worldRestored: boolean`, plus `setProgress` / `solvePuzzle`.
- `UI` store (`src/stores/uiStore.ts`): `phase`, `dialogue: string[] | null`,
  `toast: string | null`, journal/map/photo toggles.
- Save: `src/utils/saveSchema.ts` (v1 schema + `migrateSave`),
  `src/systems/SaveSystem.ts` (load/write/collect). `App.tsx` hydrates stores from
  the save and persists on a timer + on key transitions.
- `GameCanvas.tsx`: `SPOTS` (fixed landmark positions), `interact()` (distance
  checks, SPOTS win), a `requestAnimationFrame` prompt tick, `guideTarget`
  (derived from `solvedPuzzles`), and `AudioDirector` (per-frame region detection
  via `regionAt()`, positional audio sources).
- `Actors.tsx`: `Spirit` (FSM: idle/follow/guide/celebrate, refs + `useFrame`,
  no React state per frame) and `NPC` (static robed marker).
- `PuzzlePanels.tsx` + `PuzzleSystem.ts`: three puzzles, no-replay guard in
  `interact()` (solved spots show a confirmation toast, never reopen).
- `Regions.tsx`: hub-and-spoke world; lighting/particles already keyed to
  `worldRestored` / `solvedPuzzles` (gems, tree light, fireflies).
- `villageLayout.ts`: deterministic layout, `POIS`, `distToPaths`, `keepClear`.
- Population design (`docs/POPULATION_ARCHITECTURE.md`): data-driven
  `PopulationEntry[]`, distance-interaction, no colliders, `PopulationModel`
  loader pattern. This pass reuses that pattern for interactables.
## 1. Data model + save schema

### 1.1 Progress store extension

Add to `Progress` in `src/stores/stores.ts`:

```ts
export interface Progress {
  // ...existing fields unchanged...
  miniObjectives: string[];   // ids of completed mini-objectives
  secrets: string[];         // ids of discovered secrets
  lore: string[];            // ids of collected lore fragments
  npcDialogueStage: number;  // 0..4, main NPC dialogue stage
  completeMiniObjective: (id: string) => void;
  discoverSecret: (id: string) => void;
  collectLore: (id: string) => void;
  setNpcDialogueStage: (n: number) => void;
}
```

- All four new fields are **append-only id lists / monotonic counters** —
  idempotent, no duplicates (guards: `if (arr.includes(id)) return s;`).
- `npcDialogueStage` is derived-on-write: it is set explicitly by the main-NPC
  interaction handler (see §2), never computed per frame.
- `solvePuzzle` is **unchanged** — fragment count and `worldRestored` keep their
  existing semantics. Mini-objectives gate *access* to puzzles; they do not
  change puzzle solving.

### 1.2 Save schema v2

`src/utils/saveSchema.ts`:

```ts
export const SCHEMA_VERSION = 2;

export interface SaveData {
  schemaVersion: number;
  profile: { displayName: string; characterId: string };
  progress: {
    regionId: string;
    spawnId: string;
    completedQuests: string[];
    solvedPuzzles: string[];
    spiritFragments: number;
    worldRestored: boolean;
    // NEW in v2:
    miniObjectives: string[];
    secrets: string[];
    lore: string[];
    npcDialogueStage: number;
  };
  settings: { /* unchanged */ };
  updatedAt: string;
}
```

**Migration (v1 → v2), backward compatible:**

- `isValidSave` accepts `schemaVersion === 1 || 2`.
- `migrateSave` gains a v1 branch: if `schemaVersion === 1`, take the existing
  validated object, fill defaults for the four new fields
  (`miniObjectives: []`, `secrets: []`, `lore: []`,
  `npcDialogueStage: deriveStageFromProgress(p)`), bump
  `schemaVersion = 2`, return. `loadSave` already persists the migrated copy,
  so v1 saves are upgraded in place on first load.
- `deriveStageFromProgress(p)`: v1 saves have no stage; derive a sensible
  starting stage so returning players don't re-hear stage 0:
  `worldRestored ? 4 : Math.min(3, p.spiritFragments)` — i.e. stage tracks
  fragments for in-progress saves, 4 after the ending.
- The legacy `schemaVersion === 0/undefined` salvage branch also fills the four
  new fields with defaults (same derivation).
- `SAVE_KEY` stays `eldergrove.save.v1` (the key is a storage slot name, not a
  version claim — changing it would orphan existing saves).
- `defaultSave()` returns a v2 shape.
- `App.tsx` hydration + `collectSave` callsites: add the four fields to the
  progress object literal (two places: initial load `useProgress.setState` and
  the two `collectSave` progress args).

### 1.3 New file: `src/data/depthData.ts`

Single authored-content module. Pure data, no imports from stores/game code
(keeps it testable and importable from QA scripts). Exports:

```ts
// ---- Main NPC (Elder Mira) dialogue, 5 stages ----
export const MAIN_NPC_DIALOGUE: string[][]; // index = npcDialogueStage (0..4)

// ---- Secondary NPC dialogue, keyed by population entry id ----
export const NPC_DIALOGUE: Record<string, string[][]>; // npcId -> stage-bucketed lines

// ---- Mini-objectives ----
export interface MiniObjectiveStep {
  type: 'marker' | 'clue' | 'inspect';
  position: [number, number, number];
  label: string;        // prompt label, e.g. "Touch the mossy stone"
  check: { radius: number };
}
export interface MiniObjective {
  id: string;           // 'grove_trail' | 'lake_crystals' | 'ruins_runes'
  region: string;       // 'grove' | 'lake' | 'ruins'
  title: string;        // objective text for the tracker
  steps: MiniObjectiveStep[];
  reward: { puzzleId: string; toast: string }; // reveals the puzzle interaction
}
export const MINI_OBJECTIVES: MiniObjective[];

// ---- Environmental storytelling interactables ----
export interface Interactable {
  id: string;
  region: string;
  position: [number, number, number];
  label: string;        // prompt label
  text: string[];       // 1-2 sentences, shown via DialogueView
  model?: string;       // optional GLB/GLTF; default = simple emissive mesh
}
export const INTERACTABLES: Interactable[];

// ---- Secrets ----
export interface Secret {
  id: string;
  region: string;
  position: [number, number, number];
  trigger: { radius: number };
  reward: { kind: 'lore' | 'effect' | 'collectible' | 'flag'; id?: string; text: string };
  label: string;
}
export const SECRETS: Secret[];

// ---- Lore fragments ----
export interface LoreFragment {
  id: string;
  region: string;
  position: [number, number, number];
  title: string;
  text: string;         // short, 2-4 sentences
  category: 'tree' | 'keepers' | 'ruins' | 'spirit' | 'lake';
}
export const LORE_FRAGMENTS: LoreFragment[];

// ---- Region entry feedback ----
export const REGION_TITLES: Record<string, string>; // regionId -> toast title
```

All positions are world-space `[x, y, z]` in the same coordinate space as
`SPOTS` / `PROPS` (player = 2.54u). Placement must pass the same clearance
rules as population (off paths, off `BUILDING_HALF` footprints, POI clearance)
— validated by a QA script, not at runtime.

## 2. Main NPC progress-based dialogue (5 stages)

The existing guide NPC (Elder Mira, `SPOTS.npc`) currently shows a fixed two-line
dialogue on every interaction. Replace this with stage-based dialogue selected
by `Progress.npcDialogueStage`.

### Stage table

| Stage | Trigger | Content |
|---|---|---|
| 0 | First meeting (default) | Forest weakening, 3 fragments missing, asks player to follow the Spirit. |
| 1 | After 1 fragment recovered | Reacts to progress, hints at which region holds the next fragment. |
| 2 | After 2 fragments | Acknowledges progress, gives an urgent clue about the third. |
| 3 | After 3 fragments | Directs player to the Ancient Tree. |
| 4 | After ending (`worldRestored`) | Short final reaction, gratitude, the forest remembers. |

### Implementation

- `MAIN_NPC_DIALOGUE: string[][]` in `depthData.ts` — index 0..4, each entry is
  a `string[]` of 2-4 lines (same shape as existing `setDialogue` payload).
- In `interact()` (GameCanvas.tsx), the `near(SPOTS.npc)` branch:
  1. Read `npcDialogueStage` from `useProgress`.
  2. `setDialogue(MAIN_NPC_DIALOGUE[stage])`.
  3. On first interaction (stage 0, `!completedQuests.includes('met_spirit')`):
     append `'met_spirit'` to `completedQuests` (existing behavior preserved).
  4. **Stage advancement** happens in `solvePuzzle` (or a wrapper around it):
     after a puzzle is solved, if the new `spiritFragments` count exceeds the
     current `npcDialogueStage`, call `setNpcDialogueStage(spiritFragments)`.
     After `worldRestored` becomes true, set stage to 4.
- No per-frame computation. Stage is read once per interaction.

## 3. Secondary NPC dialogue

Each population NPC (merchant, fisherman, scholar, villager) gets 1-3 short
contextual lines. Dialogue is stored in `depthData.ts` keyed by NPC id.

### Data

```ts
// depthData.ts
export const NPC_DIALOGUE: Record<string, string[][]> = {
  // npcId -> array of line-sets; one set is picked per interaction
  // (round-robin or random, seeded by interaction count for determinism)
  'npc_merchant': [
    ['The forest has been quiet lately. Too quiet.', 'Folks say the old light is fading.'],
    ['I heard the grove mushrooms glow brighter last night. Something is stirring.'],
  ],
  'npc_fisherman': [
    ['The crystals under the lake hum when the wind is right.', 'Old folk say they remember the first keeper.'],
  ],
  'npc_scholar': [
    ['The ruins predate the village by centuries. The runes are a language I cannot fully read.', 'But the sequence — I think it follows the stars.'],
  ],
  'npc_villager': [
    ['My grandmother used to tell stories about the Tree. She said it dreamed.'],
    ['The spirit light follows you, doesn\'t it? Don\'t worry — it means well.'],
  ],
};
```

### Implementation

- In `interact()`, the population-entry branch (added by the population pass):
  if the entry id has an entry in `NPC_DIALOGUE`, pick a line-set (round-robin
  via a per-NPC counter in a module-level `Map<string, number>`, reset on
  reload — acceptable for flavor) and `setDialogue(lines)`.
- No store changes needed. Dialogue is ephemeral (not saved).
- Contextual variation: the merchant's lines can reference `spiritFragments`
  count (e.g. different line at 0 vs 2+ fragments) by selecting from a
  sub-array. Keep it simple: at most 2 variants per NPC, selected by
  `spiritFragments < 2 ? lines[0] : lines[1]`.

## 4. Mini-objectives before each main puzzle

Each of the three puzzle regions gets a short exploration mini-objective that
must be completed before the puzzle interaction becomes available.

### Design

| Region | Mini-objective | Steps | Duration |
|---|---|---|---|
| Grove | Follow the Spirit trail | 3 environmental markers (glowing moss stones) along the S-corridor → Spirit reveals the puzzle stone | ~1 min |
| Lake | Locate crystal clues | 3 glowing crystal formations on the NE shore → inspect each → puzzle interaction unlocks | ~1.5 min |
| Ruins | Find rune clues | 3 rune inscriptions on broken architecture → inspect → sequence hint revealed | ~2 min |

### Data structure (in `depthData.ts`)

```ts
export interface MiniObjectiveStep {
  type: 'marker' | 'clue' | 'inspect';
  position: [number, number, number];
  label: string;
  check: { radius: number };
}
export interface MiniObjective {
  id: string;
  region: string;
  title: string;
  steps: MiniObjectiveStep[];
  reward: { puzzleId: string; toast: string };
}
```

### Completion tracking

- `Progress.miniObjectives: string[]` — completed objective ids.
- A step is "done" when the player is within `check.radius` of `step.position`
  (distance check in the existing `interact()` or a lightweight per-frame
  proximity check — see §13 for performance).
- All steps in an objective complete → `completeMiniObjective(id)` → toast
  `reward.toast` → the puzzle spot's `interact()` branch now opens the puzzle
  instead of showing "complete the trail first".
- **Gating in `interact()`:** the existing `near(SPOTS.grove)` / `near(SPOTS.lake)`
  / `near(SPOTS.ruins)` branches check `miniObjectives.includes(objectiveId)`
  before calling `openPuzzle`. If not complete, show a hint toast
  ("The spirit light leads the way…") instead.
- Steps are **not** individually saved — only the objective id. On reload, if
  the objective is in `miniObjectives`, all its steps are considered done.
  (Simpler than tracking per-step; the objectives are short enough that
  partial progress is not worth persisting.)

### Rendering

- Each step is a small emissive mesh (glowing stone/crystal/rune) rendered by
  a new `<MiniObjectiveMarkers />` component in `GameCanvas.tsx` (outside
  `<Physics>`, same as Spirit/NPC).
- Markers are visible only when the player is in the relevant region
  (region-based activation, §13).
- Completed steps: mesh fades out (opacity → 0 over 0.5s) or is removed.
- No Rapier colliders. Distance-based interaction only.

## 5. Spirit companion upgrade

Extend the existing Spirit FSM in `Actors.tsx`.

### Current FSM

```
idle → follow → guide → celebrate
```

Mode is derived from `worldRestored`, `guideTarget`, `solvedPuzzles.length`.

### New states

| State | Trigger | Behavior | Exit |
|---|---|---|---|
| `hint` | Player in an active mini-objective region for > 30s without completing the next step | Spirit moves toward the next uncompleted step position + glow pulse (emissiveIntensity oscillates 2.2→3.5) | Step completed, or player leaves region, or 10s timeout (reset timer) |
| `react` | Player enters a region for the first time (tracked via a module-level `Set<string>` of visited regions, or `completedQuests` flag) | Brief 2s reaction: Spirit does a small hop (y offset +0.5) + glow flash, then returns to normal mode | 2s timer expires |

### Implementation

- `Spirit` component gains a `useRef` for FSM state:
  ```ts
  const fsm = useRef({
    state: 'idle' as Mode | 'hint' | 'react',
    hintTarget: null as THREE.Vector3 | null,
    hintTimer: 0,
    reactTimer: 0,
    regionDwell: 0,
    lastRegion: '',
  });
  ```
- In `useFrame`:
  - **Region dwell tracking:** if `regionAt(playerPos.x, playerPos.z)` differs
    from `fsm.current.lastRegion`, reset `regionDwell = 0`, update
    `lastRegion`. Otherwise increment `regionDwell += dt`.
  - **Hint trigger:** if `regionDwell > 30` AND there is an active
    mini-objective in the current region with an uncompleted step, set
    `state = 'hint'`, `hintTarget = step.position`, `hintTimer = 10`.
  - **Hint behavior:** lerp toward `hintTarget` (same lerp as guide mode),
    glow pulse: `emissiveIntensity = 2.2 + Math.sin(t * 4) * 0.65`.
  - **Hint exit:** `hintTimer -= dt`; if `hintTimer <= 0` or step completed,
    return to normal mode, reset `regionDwell = 0`.
  - **React trigger:** on region change (first visit), set `state = 'react'`,
    `reactTimer = 2`.
  - **React behavior:** y offset `+0.5 * Math.sin(reactTimer * Math.PI)`
    (single arc), glow flash `emissiveIntensity = 3.0`.
  - **React exit:** `reactTimer -= dt`; when 0, return to normal mode.
- **No direct answer text.** The Spirit only moves and glows. The player
  infers direction from the Spirit's movement.
- **No complex AI.** Simple state machine with timers. No pathfinding, no
  obstacle avoidance (the Spirit floats; it can pass through geometry).
- **Subtlety:** hint state is only active when the player is genuinely stuck
  (>30s in region). The glow pulse is gentle, not a beacon.

### Integration with mini-objectives

- The Spirit's `hint` state reads the active mini-objective's next uncompleted
  step position. This data is passed as a prop to `Spirit`:
  `hintTarget: THREE.Vector3 | null` (computed in `GameCanvas.tsx` from
  `MINI_OBJECTIVES` + `Progress.miniObjectives` + current region).
- `GameCanvas.tsx` computes `hintTarget` in a `useMemo` (recomputed when
  `miniObjectives`, `solvedPuzzles`, or region changes — not per frame).

## 6. Environmental storytelling interactables

Per region: 2-3 contextual interactables (sign, damaged shrine, inscription,
crystal formation, etc.). Brief interaction text (1-2 sentences).

### Data (in `depthData.ts`)

```ts
export interface Interactable {
  id: string;
  region: string;
  position: [number, number, number];
  label: string;        // prompt label, e.g. "Read the sign"
  text: string[];       // 1-2 sentences, shown via DialogueView
  model?: string;       // optional GLB/GLTF; default = simple emissive mesh
}
export const INTERACTABLES: Interactable[];
```

### Placement (per region)

| Region | Interactables |
|---|---|
| Village | Weathered sign at the gate ("The path north leads to the grove"), a worn bench with a carved symbol |
| Grove | A moss-covered stone with spirit footprints, a damaged shrine with a broken offering |
| Lake | A fisherman's carved post with a rune, a crystal formation with an inscription |
| Ruins | A broken column with a partial inscription, a fallen arch with a keeper's mark |
| Tree clearing | A ritual stone with a worn blessing, a small offering pile |

### Implementation

- Rendered by a new `<Interactables />` component in `GameCanvas.tsx`
  (outside `<Physics>`, sibling of `<Spirit/>`).
- Each interactable is a small mesh (default: a low-poly emissive marker —
  a small stone/crystal shape) or an optional `KayKitModel` if `model` is set.
- **Region-based activation:** only interactables in the current region
  (from `regionAt()`) are rendered. This keeps the scene graph small.
- **Interaction:** same distance-based pattern as population. In
  `interact()`, after SPOTS checks and before the "Nothing here" fallback,
  check each active interactable: if `playerPos` is within 4.5u,
  `setDialogue(interactable.text)` + `sfx.shrineInteract()`.
- **Prompt tick:** the existing `requestAnimationFrame` prompt effect gains
  the same check: show `interactable.label` when in range and no SPOTS label
  applies.
- No Rapier colliders. No per-frame React state.
- Interactables are **not** tracked in `Progress` — they are repeatable
  flavor. (If a specific interactable should be one-time, it can be added to
  `completedQuests` with a flag id, but the default is repeatable.)


## 7. Optional secrets (3-5 total)

Hidden discoveries that reward exploration. Not on the critical path.

### Data (in `depthData.ts`)

```ts
export interface Secret {
  id: string;
  region: string;
  position: [number, number, number];
  trigger: { radius: number };
  reward: {
    kind: 'lore' | 'effect' | 'collectible' | 'flag';
    id?: string;      // for 'lore': lore fragment id; for 'flag': achievement id
    text: string;     // toast text on discovery
  };
  label: string;
}
export const SECRETS: Secret[];
```

### Secret list (4 total)

| Id | Region | Location | Reward |
|---|---|---|---|
| `secret_grove_hollow` | Grove | Inside a large tree trunk (off the main corridor) | Lore entry: "The Grove's Heart" (spirit category) |
| `secret_lake_depth` | Lake | A deeper crystal cluster on the far shore, behind reeds | Visual effect: brief underwater light pulse + lore entry "What Sleeps Below" (lake category) |
| `secret_ruins_cell` | Ruins | A hidden alcove behind the broken wall (NE corner) | Hidden collectible: a small glowing amulet mesh appears permanently + achievement flag `found_ruins_cell` |
| `secret_tree_root` | Tree clearing | A hollow at the base of the Ancient Tree (south side) | Lore entry: "The First Dream" (tree category) + brief golden light pulse |

### Implementation

- Rendered by `<Secrets />` component (same pattern as `<Interactables />`).
- **Trigger:** proximity-based. When `playerPos` is within `trigger.radius`
  of a secret's position AND the secret is not in `Progress.secrets`, fire:
  - `discoverSecret(id)` → adds to `Progress.secrets`.
  - Toast `reward.text`.
  - If `reward.kind === 'lore'`: also `collectLore(reward.id)`.
  - If `reward.kind === 'effect'`: trigger a one-shot visual (a brief
    point-light flash at the secret position, 1.5s, via a ref-driven
    animation — no React state).
  - If `reward.kind === 'collectible'`: a small mesh (amulet) becomes
    permanently visible at the position (rendered when
    `Progress.secrets.includes(id)`).
  - If `reward.kind === 'flag'`: add to `completedQuests` (achievement flag).
- **Detection:** proximity check runs in the same lightweight per-frame loop
  as mini-objective step checks (§13) — only for secrets in the current
  region, only for undiscovered ones.
- **No visual marker.** Secrets are found by exploration (slightly unusual
  placement, a subtle glow or sound cue is acceptable but not required).
- **Tracked in `Progress.secrets`** — persists across saves.

## 8. Lore collectibles (5-8 total)

Short, meaningful text tied to a location. Saved persistently.

### Data (in `depthData.ts`)

```ts
export interface LoreFragment {
  id: string;
  region: string;
  position: [number, number, number];
  title: string;
  text: string;         // 2-4 sentences
  category: 'tree' | 'keepers' | 'ruins' | 'spirit' | 'lake';
}
export const LORE_FRAGMENTS: LoreFragment[];
```

### Lore list (6 total)

| Id | Region | Category | Title |
|---|---|---|---|
| `lore_tree_origin` | Tree clearing | tree | "The First Seed" — how the Ancient Tree came to be |
| `lore_keeper_first` | Ruins | keepers | "The First Keeper" — the original guardian of the forest |
| `lore_ruins_fall` | Ruins | ruins | "The Silence" — what happened to the ruins' people |
| `lore_spirit_nature` | Grove | spirit | "What the Spirit Is" — the nature of the companion |
| `lore_lake_origin` | Lake | lake | "The Lake's Memory" — how Crystal Lake formed |
| `lore_keeper_last` | Village | keepers | "The Last Keeper" — Elder Mira's role (found near the well) |

### Implementation

- Rendered by `<LoreFragments />` component (same pattern as
  `<Interactables />`).
- Each lore fragment is a small glowing book/scroll mesh (or a simple
  emissive marker) at its position.
- **Interaction:** distance-based (4.5u). On interact:
  - If not in `Progress.lore`: `collectLore(id)`, show the lore text via
    `setDialogue([title, text])`, play a soft SFX.
  - If already collected: show a brief toast ("You already know this story.")
    — the text is not re-shown (avoids re-reading).
- **Tracked in `Progress.lore`** — persists across saves.
- **Journal integration (optional, low priority):** the existing
  `JournalView` can list collected lore fragments (title + category) below
  the quest steps. This is a small UI addition, not a new screen.
- Lore fragments are **not** quest-critical. They reward exploration.
- Some lore is also granted by secrets (§7) — the `reward.kind === 'lore'`
  path calls `collectLore` with the same id, so the journal shows it
  regardless of how it was obtained.


## 9. World reaction to fragment progress

The world visibly improves as fragments are recovered. Driven by
`Progress.spiritFragments` (0-3) and `worldRestored`.

### Stages

| Fragments | World state |
|---|---|
| 0 | Forest weakest/darkest. Current baseline (no change). |
| 1 | Subtle improvement: slightly brighter ambient, more firefly particles, grove gems glow a touch stronger. |
| 2 | Noticeably more magical energy: brighter lake crystals, more particles, Spirit glow slightly stronger. |
| 3 | Ancient Tree clearly ready: tree light intensifies, golden tint begins, fireflies shift warmer. |
| 3 + restored | Full restore (existing `worldRestored` behavior — golden light, warm fireflies). |

### Implementation

- **No geometry rebuild.** Only lighting, particles, material emissive, and
  animation changes.
- A new `useWorldState()` hook (or a small `WorldState` component) reads
  `spiritFragments` + `worldRestored` and derives a `worldLevel: 0|1|2|3`
  (0 = baseline, 1-3 = fragment count, capped; `worldRestored` overrides to
  the full-restore look).
- **Lighting:** the existing sun/ambient in `GameCanvas.tsx` and the
  per-region point lights in `Regions.tsx` get their `intensity` scaled by a
  small multiplier from `worldLevel` (e.g. `1 + worldLevel * 0.15`). The
  Ancient Tree point light (already keyed to `worldRestored`) gets an
  intermediate step at `worldLevel === 3` (intensity 14 → 22 → 36).
- **Particles:** `FirefliesPoints` count/opacity scales with `worldLevel`
  (e.g. opacity `0.6 + worldLevel * 0.1`, and the firefly color shifts from
  cool `#cfe9ff` toward warm `#ffe9a0` as `worldLevel` rises). No new
  particle system — just parameter changes on the existing `Points`.
- **Material emissive:** grove gems and lake crystals (already in
  `Regions.tsx`) get their `emissiveIntensity` bumped by `worldLevel`.
- **Spirit brightness:** the Spirit's `pointLight` intensity and glow
  `emissiveIntensity` scale slightly with `worldLevel` (the Spirit is the
  player's anchor for "the world is getting better").
- **Audio (optional, low priority):** the ambient crossfade in
  `AudioSystem.setRegion` could layer a subtle additional pad at
  `worldLevel >= 2`. Keep it optional — the visual change is the primary
  signal.
- **Performance:** all changes are parameter updates on existing objects
  (no new draw calls, no new geometry). The `worldLevel` is a single number
  recomputed only when `spiritFragments` or `worldRestored` changes
  (`useMemo`).

## 10. Region entry feedback

Subtle feedback when the player enters a new region. No full-screen
interruptions.

### Feedback

- **Region title toast:** a brief toast (2s) with the region name
  (e.g. "Mushroom Grove", "Crystal Lake", "Whispering Ruins"). Uses the
  existing `setToast` — no new UI.
- **Spirit reaction:** the `react` state from §5 (brief hop + glow flash).
- **Ambient change:** already handled by `AudioDirector`'s `setRegion`
  crossfade (existing).

### Implementation

- `AudioDirector` already detects region changes via `regionAt()` and calls
  `setRegion(region)`. Extend this: when the region changes, also
  `setToast(REGION_TITLES[region])` (from `depthData.ts`) and trigger the
  Spirit's `react` state.
- **Deduplication:** only fire the toast on the *first* entry to a region in
  a session (a module-level `Set<string>` of toasted regions, reset on
  reload). Re-entering a region does not re-toast.
- **No full-screen interruption.** The toast is the existing small HUD toast,
  not a modal.
- `REGION_TITLES` in `depthData.ts`:
  ```ts
  export const REGION_TITLES: Record<string, string> = {
    village: 'Eldergrove Village',
    grove: 'Mushroom Grove',
    lake: 'Crystal Lake',
    ruins: 'Whispering Ruins',
    tree: 'The Ancient Tree',
    spirit: 'Spirit Clearing',
  };
  ```


## 11. Puzzle feedback

Three phases: before, during, after.

### Before (objective/context clear)

- The quest tracker (existing `HUD` in `HudScreens.tsx`) shows the current
  objective. With mini-objectives, the tracker text becomes more specific:
  - If the mini-objective for the current target region is not complete:
    "Follow the Spirit into the Grove" / "Investigate the Crystal Lake" /
    "Search the Whispering Ruins".
  - If the mini-objective is complete but the puzzle is unsolved:
    "Solve the Spirit Path" / "Decode the Rune Sequence" / "Align the Light".
  - This is a small change to the `step` computation in `HUD`: instead of
    indexing `QUEST_MAIN.steps` by `solvedPuzzles.length`, derive the current
    objective from `solvedPuzzles` + `miniObjectives` + `worldRestored`.
- The Spirit's `guide` mode already points to the target region
  (`guideTarget`). No change.

### During (interaction feedback)

- Existing puzzle panels already provide interaction feedback (tap
  highlights, mistake resets, success SFX). No change.

### After (completion)

- Existing: `sfx.fragment()` + "recovered" toast (fired by `PuzzlePanels`
  `useSolve`). No change.
- **New:** Spirit reaction — when a puzzle is solved, the Spirit enters a
  brief `celebrate`-like pulse (reuse the existing celebrate glow, 2s) even
  if `worldRestored` is not yet true. This is a one-shot animation triggered
  by a prop (`celebratePulse: number` — a timestamp; the Spirit animates for
  2s after it changes).
- **New:** World update — `worldLevel` increments (§9), so the world visibly
  improves immediately after solving.
- **No-replay logic preserved:** the existing guard in `interact()` (solved
  spots show a confirmation toast, never reopen) is unchanged. The Spirit
  pulse and world update are driven by `solvedPuzzles` changing, which only
  happens once per puzzle.

## 12. Quest/objective UX

Simple: the current objective clearly communicates the next goal. No giant
quest log, no MMO-style task lists.

### Objective derivation

A single function `currentObjective(progress): string` (in `depthData.ts` or
a small `src/systems/objective.ts`) returns the current objective text:

```
if worldRestored: "The forest is restored. Wander as you wish."
else if solvedPuzzles.length === 0:
  if !completedQuests.includes('met_spirit'): "Speak with the Forest Keeper"
  else if !miniObjectives.includes('grove_trail'): "Follow the Spirit into the Grove"
  else: "Solve the Spirit Path"
else if solvedPuzzles.length === 1:
  if !miniObjectives.includes('lake_crystals'): "Investigate the Crystal Lake"
  else: "Decode the Rune Sequence"
else if solvedPuzzles.length === 2:
  if !miniObjectives.includes('ruins_runes'): "Search the Whispering Ruins"
  else: "Align the Light in the Ruins"
else: "Restore the Ancient Tree"
```

- The `HUD` quest tracker calls this function (replacing the current
  `QUEST_MAIN.steps[step]` index).
- The `JournalView` can still show the full `QUEST_MAIN.steps` list (existing
  behavior) — the journal is the "overview", the HUD tracker is the "now".
- **No new UI.** The existing `hud quest-tracker` div is reused; only the
  text source changes.
- `QUEST_MAIN` in `gameData.ts` is kept (the journal still uses it); the
  per-step text in `QUEST_MAIN.steps` can be updated to match the new
  objective wording, or left as-is (the journal is secondary).


## 13. Performance

Hard rules (consistent with the population architecture):

- **No global per-frame scans.** All proximity checks (mini-objective steps,
  secrets, interactables, lore) run against a **region-filtered** list: only
  entries whose `region` matches the current `regionAt()` result are
  considered. With 2-3 entries per category per region, that is ≤ ~10
  distance checks per frame — trivial.
- **One shared proximity loop.** A single `useFrame` in a new
  `<DepthDirector />` component (sibling of `AudioDirector`) handles all
  proximity triggers (mini-objective steps, secret discovery) at a
  **throttled rate (10 Hz, not per-frame)** — distance checks at 10 Hz are
  imperceptible for 4.5u-radius triggers. It writes to the stores
  (`completeMiniObjective`, `discoverSecret`) only on state change, so React
  re-renders are rare.
- **NPCs:** lightweight idle/proximity behavior only (population pass
  handles this: distance-pause at 28u, ≤6 animated models). No new NPC AI.
- **Spirit:** simple state machine with timers (§5). No pathfinding, no
  obstacle avoidance. One `lerp` + a few `sin` calls per frame.
- **Secrets/interactables/lore:** region-based activation (only the current
  region's entries render). Small meshes, no shadows
  (`castShadow = false`), frustum culling on.
- **No complex pathfinding, no expensive physics.** No Rapier colliders for
  any new entity (same convention as population + existing NPC/Spirit).
- **No per-frame React state.** All motion via refs + `useFrame`. Store
  writes only on discrete events (step completed, secret found, region
  change).
- **Budget:** < 2 ms/frame total for the depth pass (proximity loop +
  markers + Spirit FSM). The existing scene already carries the heavy cost.

## 14. File plan

### New files

| File | Purpose |
|---|---|
| `src/data/depthData.ts` | All authored content: `MAIN_NPC_DIALOGUE`, `NPC_DIALOGUE`, `MINI_OBJECTIVES`, `INTERACTABLES`, `SECRETS`, `LORE_FRAGMENTS`, `REGION_TITLES`, `currentObjective()`. Pure data + one pure function. |
| `src/entities/DepthMarkers.tsx` | `<MiniObjectiveMarkers />`, `<Interactables />`, `<Secrets />`, `<LoreFragments />` — small emissive-mesh renderers, region-activated, no colliders. (One file, four small components, shared marker-mesh helper.) |
| `src/systems/DepthDirector.tsx` | `<DepthDirector />` — the single throttled (10 Hz) proximity loop: mini-objective step completion, secret discovery. Sibling of `AudioDirector`. |
| `scripts/depth-check.mts` | QA: validate all depthData placements (off paths via `distToPaths`, off `BUILDING_HALF` footprints, POI clearance via `keepClear`, no overlaps between depth entries). |

### Modified files

| File | Change |
|---|---|
| `src/stores/stores.ts` | `Progress`: add `miniObjectives`, `secrets`, `lore`, `npcDialogueStage` + the four action methods. |
| `src/utils/saveSchema.ts` | `SCHEMA_VERSION = 2`; v2 progress fields; `isValidSave` accepts v1+v2; `migrateSave` v1→v2 branch (defaults + stage derivation); `defaultSave` v2 shape. |
| `src/app/App.tsx` | Hydration + both `collectSave` callsites: include the four new progress fields. |
| `src/game/GameCanvas.tsx` | (1) `interact()`: main-NPC branch uses `MAIN_NPC_DIALOGUE[stage]`; puzzle branches gated on `miniObjectives`; new branch for interactables/lore (before "Nothing here"). (2) Prompt tick: labels for interactables/lore. (3) Render `<DepthMarkers />` + `<DepthDirector />`. (4) `Spirit` props: `hintTarget`, `celebratePulse`. (5) `guideTarget` unchanged. |
| `src/entities/Actors.tsx` | `Spirit`: add `hint` + `react` FSM states, `hintTarget`/`celebratePulse` props, region-dwell tracking. `NPC`: unchanged (dialogue handled in `interact()`). |
| `src/regions/Regions.tsx` | World reaction (§9): light intensities, gem/crystal emissive, firefly opacity/color scaled by `worldLevel`. |
| `src/systems/AudioSystem.ts` | `setRegion`: fire region-title toast + Spirit react trigger (via a callback or a small event — see risk R4). Optional: ambient layer at `worldLevel >= 2`. |
| `src/ui/HudScreens.tsx` | `HUD` quest tracker: use `currentObjective(progress)` instead of `QUEST_MAIN.steps[step]`. `JournalView` (optional): list collected lore. |
| `src/data/gameData.ts` | Optional: update `QUEST_MAIN.steps` wording to match new objectives. |
| `docs/ARCHITECTURE.md` | One line: depth pass (data-driven exploration content, region-activated, no colliders). |

### Unchanged (explicit)

`Player.tsx`, `CameraRig.tsx`, `VillageScenery.tsx`, `villageLayout.ts`,
`PuzzleSystem.ts`, `PuzzlePanels.tsx` (except the `useSolve` completion hook
gaining the Spirit pulse trigger — a 2-line change), all existing
props/paths/colliders, `TouchControls.tsx`, `input.ts`.

## 15. Integration checklist (implementation order)

1. **Schema + store (foundation).** Extend `Progress` (stores.ts), bump
   saveSchema to v2 with migration, update `App.tsx` hydration/persist.
   *Verify:* existing v1 save loads, new fields default correctly, save
   round-trips as v2. Run `saveAndName.test.ts` + add a v1→v2 migration test.
2. **depthData.ts (content).** Author all data: dialogue (5 stages + 4 NPC
   sets), 3 mini-objectives (9 steps), ~10 interactables, 4 secrets, 6 lore,
   region titles, `currentObjective()`. *Verify:* `scripts/depth-check.mts`
   passes (placement clearance).
3. **Mini-objectives (core loop change).** `DepthDirector` proximity loop +
   `MiniObjectiveMarkers` + `interact()` gating + `completeMiniObjective`.
   *Verify:* each puzzle is unreachable until its mini-objective completes;
   completion persists across reload.
4. **Main NPC dialogue.** Stage-based `interact()` branch + stage
   advancement in `solvePuzzle` wrapper. *Verify:* stage advances 0→1→2→3 on
   fragment recovery, 4 after ending; v1-migrated save starts at derived
   stage.
5. **Secondary NPC dialogue.** `NPC_DIALOGUE` lookup in the population
   interact branch. *Verify:* each NPC shows its lines; no store writes.
6. **Spirit upgrade.** `hint` + `react` states, `hintTarget`/`celebratePulse`
   props, region-dwell timer. *Verify:* hint fires after 30s dwell, points at
   next step; react fires on first region entry; no per-frame React state.
7. **Interactables + lore.** `Interactables` + `LoreFragments` renderers +
   `interact()` branches + prompt labels + `collectLore`. *Verify:* region
   activation (only current region renders); lore persists; repeatable
   interactables don't spam.
8. **Secrets.** `Secrets` renderer + discovery in `DepthDirector` + reward
   dispatch (lore/effect/collectible/flag). *Verify:* each secret fires once,
   persists, reward applies.
9. **World reaction.** `worldLevel` derivation + Regions.tsx
   light/emissive/firefly scaling + Spirit brightness. *Verify:* visible
   improvement at 1/2/3 fragments; no new draw calls (profile).
10. **Region entry feedback.** Toast on first region entry + Spirit react
    trigger. *Verify:* toast fires once per region per session; no
    full-screen interruption.
11. **Puzzle feedback + objective UX.** Spirit `celebratePulse` on solve +
    `currentObjective()` in HUD tracker (+ optional journal lore list).
    *Verify:* tracker text matches actual next goal at every progress state;
    no-replay logic intact (solved spots never reopen).
12. **Docs + QA.** Update `docs/ARCHITECTURE.md`; run full QA:
    `clearance.mts`, `depth-check.mts`, `walk-test.mjs`, save migration
    tests, performance profile (depth pass < 2 ms/frame).

## 16. Risks

- **R1 — `interact()` complexity.** `interact()` already has 5 branches;
  adding interactables/lore/mini-objective gating makes it long. Mitigation:
  extract a `resolveInteraction(playerPos, progress): { kind, payload }`
  pure helper (testable) that `interact()` dispatches on. Keep SPOTS-first
  priority.
- **R2 — Save migration edge cases.** v1 saves with partial progress
  (e.g. 2 fragments, no mini-objectives) must not soft-lock: the derived
  stage and empty `miniObjectives` mean the player re-does the current
  region's mini-objective (≤2 min) — acceptable, and the Spirit hint state
  keeps it from feeling lost. Mitigation: the stage derivation in
  `migrateSave` (§1.2) + a one-time toast on migrated saves ("The spirit
  remembers your journey…").
- **R3 — Proximity-loop store writes.** Firing `completeMiniObjective` /
  `discoverSecret` from `useFrame` must be idempotent and change-detected
  (check `includes` before writing) to avoid render loops. The 10 Hz
  throttle + idempotent guards make this safe.
- **R4 — AudioSystem → UI coupling.** `setRegion` (AudioSystem) firing a
  toast (uiStore) is a layering smell. Mitigation: `AudioDirector` (which
  already owns region-change detection in the React tree) fires the toast +
  Spirit react, not `AudioSystem` itself. `AudioSystem.setRegion` stays
  audio-only.
- **R5 — Content volume creep.** The pass is only as good as its restraint:
  3 mini-objectives, 4 secrets, 6 lore, ~10 interactables is the ceiling.
  Adding more content is a follow-up, not part of this pass.
- **R6 — Marker visibility.** Emissive markers must read against the
  existing lighting (dark-fantasy grade). Mitigation: markers use
  `emissiveIntensity >= 2` + a small `pointLight` (distance ≤ 4) only when
  the player is within ~12u (toggled in the proximity loop, not per-frame
  React).


