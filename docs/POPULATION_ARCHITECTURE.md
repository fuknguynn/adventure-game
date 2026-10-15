# Population Architecture

Design for adding NPCs and wildlife to Eldergrove. Decorative + optional interaction only —
not quest-critical. No gameplay-logic or environment-layout changes. Reuses the existing
`KayKitModel` error-boundary pattern, the `SPOTS` distance-interaction pattern, and the
`FirefliesPoints` procedural-particle pattern.

## Key design decisions

1. **One loader, reused.** `GLTFLoader` already handles both KayKit `gltf+bin` pairs and
   Quaternius single-file `.glb`. No new loader. A thin `PopulationModel` component wraps the
   same `ModelErrorBoundary` + `Suspense` + `useLoader(GLTFLoader)` pattern as `KayKitModel`,
   adding `SkeletonUtils.clone` (required for skinned meshes — a plain `Object3D.clone` leaves
   bones bound to the template skeleton, so the mesh stays in bind T-pose) and an
   `AnimationMixer` for clip playback.
2. **No Rapier colliders for any population entry.** Interaction is distance-based (the existing
   `SPOTS` + `interact()` pattern in `GameCanvas.tsx`), not collider-based. This trivially
   satisfies "no collision on every animal" and "never block the player." The existing guide NPC
   is already a plain `<group>` outside `<Physics>`; population follows the same convention.
3. **Data-driven placement.** A new `src/regions/population.ts` holds authored, deterministic
   entries (same style as `villageLayout.ts`). A `Population` component renders them all.
   No per-frame React state — refs + `useFrame`, matching existing code.
4. **Procedural insects.** Butterflies/fireflies are a single `Points` object with sine-wave
   motion (the `FirefliesPoints` pattern), not meshes or model animations. One draw call.
5. **Distance-based animation pause.** `AnimationMixer.update` is skipped for any model farther
   than ~28u from the player. Hub-and-spoke means only 1–2 regions are in view at once, so the
   active animated set stays small.

## Architecture diagram

```
GameCanvas.tsx
  <Canvas>
    <Suspense>
      <Physics>                      <- player + scenery colliders (UNCHANGED)
        <GroundBounds/>
        <Player/>
        <Regions/>                   <- scenery, props, landmarks (UNCHANGED)
      </Physics>
      <NPC/>                         <- existing guide (UNCHANGED)
      <Spirit/>                      <- existing companion (UNCHANGED)
      <Population/>                  <- NEW: all NPCs + wildlife + procedural insects
        PopulationModel (per entry)
          ModelErrorBoundary         <- same as KayKitModel: one bad model => null, no crash
            <Suspense>
              Inner: useLoader(GLTFLoader) -> SkeletonUtils.clone -> <primitive>
              AnimationMixer (clip by name / baked range / speed)
              useFrame: distance-pause + optional small-radius wander
        InsectPoints (per region)    <- single <points>, sine-wave motion, no model
    </Suspense>
    <CameraRig/>
    <AudioDirector/>
  </Canvas>

interact() in GameCanvas.tsx         <- extended: distance-check interactable population entries
  -> setDialogue(entry.dialogue)     <- same DialogueView, no new UI

Data:
  src/regions/population.ts          <- PopulationEntry[] (authored, deterministic)
  src/regions/villageLayout.ts       <- distToPaths / POIS / BUILDING_HALF (placement validation)
  asset-manifest.json                <- new character/wildlife entries
```

## Data structures

New file `src/regions/population.ts` (authored data, deterministic — no RNG needed since
placements are hand-placed for readability):

```ts
export type RegionId = 'village' | 'market' | 'lake' | 'grove' | 'clearing' | 'ruins' | 'tree';

export interface PopulationAnimation {
  /** Clip name for separate-clip models (Quaternius / KayKit Rig_Medium). */
  clip?: string;
  /** Baked-timeline range (Gobkit-style): seconds into the single embedded clip. */
  start?: number;
  end?: number;
  /** Playback rate (default 1). */
  speed?: number;
}

export interface PopulationWander {
  /** Max horizontal distance from authored position (u). Small: 1.5–4. */
  radius: number;
  /** Max horizontal speed (u/s). Slow: 0.3–0.8. */
  speed: number;
}

export interface PopulationEntry {
  id: string;
  /** Path to GLB or GLTF (GLTF implies sibling .bin). */
  model: string;
  region: RegionId;
  position: [number, number, number];
  rotationY?: number;
  /** Uniform scale. Normalized so the model's real height matches the target below. */
  scale?: number;
  animation?: PopulationAnimation;
  wander?: PopulationWander;
  /** true => distance-interactable (E key). Default false. */
  interactable?: boolean;
  /** Dialogue lines shown via existing DialogueView when interacted. */
  dialogue?: string[];
  /** HUD prompt label, e.g. "Talk to the merchant". */
  label?: string;
  /** Target world height in u (player = 2.54). Used to compute scale if not given. */
  targetHeight?: number;
}

export interface InsectField {
  id: string;
  region: RegionId;
  /** Center of the field. */
  center: [number, number, number];
  /** Rough bounding radius of the field (u). */
  radius: number;
  count: number;
  color: string;
  /** Vertical bob amplitude + speed for sine motion. */
  bob?: { amp: number; speed: number };
}

export const POPULATION: PopulationEntry[] = [ /* ... */ ];
export const INSECTS: InsectField[] = [ /* ... */ ];
```

Notes on the interface vs. the task sketch:
- `collider` is **removed** — no population entry gets a Rapier collider (see decision 2).
  Keeping the field would invite misuse.
- `targetHeight` added: scale normalization is a first-class concern (player = 2.54u).
  If `scale` is omitted, the loader computes it from the model's bounding box height.
- `dialogue` + `label` added: interaction reuses the existing `setDialogue` / prompt path.

### Scale normalization

Target heights (u): NPC 2.0–2.5, deer ~1.5, rabbit ~0.4, duck ~0.3, butterfly ~0.1 (procedural,
no model). On load, `PopulationModel` measures the cloned scene's `Box3` height and, if
`targetHeight` is set and `scale` is not, sets `scale = targetHeight / bboxHeight`. If both are
set, `scale` wins (authored override). This keeps every model at the right size regardless of
the source asset's native units (Quaternius GLBs are often ~1.7–2.0u for humans; KayKit
characters 2.18–2.65u per the animation audit).


## Model loading

Reuse the `KayKitModel` pattern; do **not** create a second loader. `GLTFLoader` (via
`useLoader`) already parses both KayKit `gltf+bin` pairs and Quaternius single-file `.glb`.

New component `src/entities/PopulationModel.tsx`:

- Wraps the same `ModelErrorBoundary` (export it from `Model.tsx` or duplicate the 10-line
  class) + `<Suspense fallback={null}>`. One bad model renders `null`; the game never crashes.
- `useLoader(GLTFLoader, entry.model)` — cached by R3F, so a model used by two entries loads once.
- `SkeletonUtils.clone(gltf.scene)` — **required** for skinned meshes. A plain `Object3D.clone`
  leaves `SkinnedMesh` bound to the template skeleton, so mixer-driven bones never reach the
  mesh and the character is stuck in bind T-pose (the exact bug documented in `Player.tsx`).
- Scale: apply `entry.scale`, or compute from `Box3` height vs `targetHeight` (see above).
- Render `<primitive object={clone} />` inside a `<group>` whose transform is driven by
  `useFrame` (wander + facing). The clone itself is static.

### Animation strategy

Two source shapes, one `AnimationMixer` per model instance:

1. **Separate clips** (Quaternius, KayKit `Rig_Medium`): `gltf.animations` holds named clips.
   Pick by `animation.clip` name; `action.play()` with `action.timeScale = animation.speed`.
   NPCs: `Idle_A` (breathing/bob). Animals: a walk-in-place or eat loop.
2. **Baked timeline** (Gobkit-style single embedded clip): play the one clip, but constrain the
   loop to `animation.start`..`animation.end` via `action.setLoop(LoopRepeat, Infinity)` plus a
   time-of-day-free trick — set `action.time` and clamp in `useFrame` (wrap `end` back to
   `start`). Simpler: if the clip is a short loop, just play it; use the range only when the
   embedded timeline is long and only a segment is a clean loop.

**Procedural (no model):** butterflies/insects are `InsectPoints` — a single `THREE.Points`
per field, positions updated in `useFrame` with per-particle sine offsets (phase, radius,
height). Same pattern as `FirefliesPoints` in `Regions.tsx`. No model, no mixer, one draw call.

**Distance pause:** in `useFrame`, if `playerPos.distanceTo(entry.position) > 28`, skip
`mixer.update(dt)` (and skip wander). The model freezes in place — invisible at that range
given fog (24–85u) and hub-and-spoke layout. This is the LOD: no geometry LOD needed at this
population size.


## Placement system

### Static placement (default)

Authored positions in `population.ts`, same convention as `PROPS` in `villageLayout.ts`.
Each entry is hand-placed for readability: facing the player's approach, clear of paths,
not overlapping props. Deterministic — no RNG.

### Simple wandering (optional)

`wander: { radius, speed }` — small-radius random walk, **no pathfinding**:
- In `useFrame`, pick a new target point inside the radius disc every 3–6s (seeded per-entry
  phase so it's stable across reloads).
- Lerp position toward the target at `speed`; face the movement direction (same yaw-smoothing
  as `Player.tsx`: `visualYaw += d * (1 - exp(-k*dt))`).
- Hard clamp: never leave the radius disc; never cross a path (re-check `distToPaths` —
  exported from `villageLayout.ts` — and steer back if within 1.2u of a path).
- No Rapier, no collision resolution. Animals may visually overlap props; that's acceptable
  for decorative fauna and far cheaper than collision.

### Keeping NPCs off paths / colliders / readable

Placement validation (run in a QA script, not at runtime):
1. `distToPaths(x, z) >= 1.5` — off the walking line (paths are ~1.1u-spaced samples).
2. Not inside any `BUILDING_HALF` footprint (expanded by the entry's own half-width).
3. Not within `POIS` clearance radii (the existing `keepClear` logic).
4. Readability: NPC faces the nearest path or plaza; at least ~3u of open ground in front.

These checks live in `scripts/` (extend `clearance.mts` or add `population-check.mts`) and run
in CI/QA, keeping `population.ts` a pure data file.

### Per-region placement data

`POPULATION` is a flat array with a `region` field; the `Population` component filters by
region only for the distance-pause culling (all entries render in one pass — the world is
small enough that per-region React subtrees buy nothing). Region is metadata for authoring
and for the QA script, not a render boundary.


## Integration points

### React tree position

`<Population />` renders **outside `<Physics>`**, as a sibling of the existing `<NPC/>` and
`<Spirit/>` in `GameCanvas.tsx` (inside the same `<Suspense>`). Rationale:
- No population entry has a Rapier collider, so there is nothing for `<Physics>` to manage.
- The existing guide NPC already sits outside `<Physics>` — population follows the same
  convention, so there is no second pattern.
- `<Suspense>` is already there; `PopulationModel`'s inner `useLoader` suspends per-model and
  the `ModelErrorBoundary` isolates failures, exactly like `KayKitModel` inside `Regions`.

### Interaction with existing Spirit/NPC

No change to `Spirit` or the existing `NPC` component. The existing guide NPC stays as-is
(it is the "main guide NPC" of the village population plan). Population entries are additive;
they never touch `SPOTS.spirit` / `SPOTS.npc` logic.

### Interaction (talk to merchant, etc.)

Reuse the existing distance-interaction pattern in `GameCanvas.tsx`:
- `interact()` gains a final branch: for each `interactable` population entry, if
  `playerPos` is within 4.5u of `entry.position`, fire `setDialogue(entry.dialogue)` +
  `sfx.shrineInteract()`. Order: existing SPOTS checks first (they win), population last.
- The contextual prompt effect (the `requestAnimationFrame` tick that sets `near`) gains the
  same check: show `entry.label` (e.g. "Talk to the merchant") when in range and no SPOTS
  label applies.
- No new UI, no new store fields — `DialogueView` already renders `dialogue: string[]`.
- Animals are never `interactable` (decorative only).

### Colliders / blocking the player

None. No `RigidBody`, no `CuboidCollider`, no trigger volumes. The player can walk through
every population entry. This is the explicit design: decorative actors must never block
movement or puzzle approach paths.


## Performance budget

**Budget: < 5 ms/frame for all population** (models + animation + wander + insects).

| Item | Budget | How |
|---|---|---|
| Concurrent animated models | ≤ 6 | Distance-pause at 28u; hub-and-spoke means 1–2 regions visible. Hard cap: if >6 entries are in range, only the 6 nearest animate. |
| `AnimationMixer.update` | ~0.3–0.8 ms each | One mixer per visible model; skipped when paused by distance. |
| Wander math | ~0.05 ms each | A few `lerp`/`atan2` per entry; trivial. |
| Insect `Points` | ~0.1 ms per field | One `BufferAttribute` update per field (≤ 40 particles). No per-particle objects. |
| Draw calls | +1 per visible model, +1 per insect field | Models are individual (not instanced) — at ≤6 visible this is fine. Insects are always `Points` (never meshes). |
| Shadows | off for animals | `castShadow = false` on all population meshes (they're small/far; the player + hero props carry the shadow budget). NPCs: `castShadow = true` only if within 20u (toggle in `useFrame`). |

Rules:
- **No per-frame React state.** All motion via refs + `useFrame` (existing convention).
- **No pathfinding.** Wander is a radius disc + lerp; the only spatial query is
  `distToPaths` (a precomputed sample list, O(n) with n≈200 — fine at 10 Hz, not per-frame;
  run the path-avoidance check every 0.5s, not every frame).
- **Points, not meshes, for anything with >3 instances** (butterflies, fireflies, bats).
- **Frustum culling stays on** (`frustumCulled = true`, as `KayKitModel` sets).


## Population plan (per region)

Hard rules: ≤ 4–6 humanoid NPCs total; no dozens of animals; no per-animal collision; no
pathfinding; ≤ 2 visibly different character art styles per region; every entry has a purpose.

| Region | Entries | Purpose |
|---|---|---|
| Village (plaza) | existing guide NPC (Elder Mira, unchanged) + 1 villager (idle, near well) + 1 merchant (interactable, at market stall) | Guide = quest anchor. Villager = lived-in feel, faces plaza. Merchant = optional "buy" flavor dialogue. |
| Market | 1 vendor at the tent (interactable, optional) + 1 villager only if readable from the plaza road | Vendor sells "nothing" — flavor dialogue about the fragments. Second villager only if it doesn't crowd the trading pocket. |
| Crystal Lake | 1 fisherman/traveler on the NE shore (static, idle) + 2–3 ducks on the water (procedural bob, no model anim) | Fisherman = story flavor (he's seen the crystals). Ducks = water life, cheap. |
| Mushroom Grove | 2 rabbits (wander, small radius) + 1 fox-like creature (static, alert) + butterfly `InsectField` (12–16 particles) | Woodland life; rabbits wander near the S-corridor, fox on the clearing rim. Butterflies = the grove's "magic" read. |
| Spirit Clearing | NO crowd. 1 rare deer (static, slow head-bob) + 1 butterfly `InsectField` (4–6, teal-tinted) | Sacred quiet. The deer is the only "magical wildlife" — it does not wander. |
| Whispering Ruins | 1 explorer/scholar (static, near the gateway) + 2–3 bats (procedural `Points`, circling) | Scholar = lore flavor (he's mapping the ruins). Bats = dead-zone atmosphere, procedural. |
| Ancient Tree | 0 humanoids. 1 deer at the outer ring edge (static, facing the tree) — only if it doesn't break the sacred isolation; otherwise 0 | Preserve isolation. Default: 0 entries; the deer is optional and must sit outside the stone ring. |

Humanoid total: guide + villager + merchant + vendor + (optional 2nd villager) + fisherman +
scholar = **6 max** (5 if the optional villager is dropped). Within the 4–6 rule.

Art-style rule: all humanoids use ONE character family (KayKit Adventurers / Quaternius
humans — pick one, not both, per region). Animals are a separate, consistent style. No region
mixes 3+ styles.


## Asset manifest update

Extend `asset-manifest.json` with one entry per new model, matching the existing schema:

```json
{
  "id": "npc-merchant",
  "category": "character",
  "repository": "<source repo URL>",
  "sourcePath": "<upstream path>",
  "localPath": "public/models/characters/Merchant.glb",
  "format": "glb",
  "license": "<license>",
  "licenseEvidencePath": "public/licenses/<file>",
  "author": "<author>",
  "scale": 1,
  "animations": ["Idle_A", "Talk"],
  "usage": "village merchant (population)",
  "optimizedBytes": 0,
  "verified": true
}
```

Rules:
- `category`: `"character"` for humanoids, `"wildlife"` for animals (new category value —
  add it to any category enum/validator if one exists).
- `format`: `"glb"` for single-file, `"gltf+bin"` for KayKit pairs.
- `animations`: list the clip names the population entry actually uses (or `[]` for
  procedural/static).
- `usage`: always ends with `(population)` so these are distinguishable from player characters.
- `verified: true` only after the model loads and animates in-game (same bar as existing entries).
- New models land in `public/models/characters/` (humanoids) or a new
  `public/models/wildlife/` dir (animals). The vendor script (`scripts/vendor-assets.mjs`)
  appends entries at build time; hand-vendored population models are added the same way.
- Update the `notes` array: replace the "Wildlife gap" note once real fauna models exist.

## File plan

**New files:**
| File | Purpose |
|---|---|
| `src/regions/population.ts` | `PopulationEntry[]` + `InsectField[]` authored data (deterministic). |
| `src/entities/PopulationModel.tsx` | Per-entry loader: error boundary + `useLoader` + `SkeletonUtils.clone` + `AnimationMixer` + distance-pause + wander. |
| `src/entities/Population.tsx` | `<Population/>`: maps `POPULATION` → `PopulationModel`, `INSECTS` → `InsectPoints`. |
| `src/entities/InsectPoints.tsx` | Procedural `Points` field (sine motion), the `FirefliesPoints` pattern. |
| `scripts/population-check.mts` | QA: validate placements (off paths, off colliders, POI clearance, readability). |

**Modified files:**
| File | Change |
|---|---|
| `src/game/GameCanvas.tsx` | Render `<Population/>` (sibling of `<NPC/>`); extend `interact()` + prompt tick with interactable-entry distance checks. |
| `src/game/Model.tsx` | Export `ModelErrorBoundary` (or `PopulationModel` duplicates it — prefer export to avoid a second class). |
| `asset-manifest.json` | New character/wildlife entries + `notes` update. |
| `docs/ARCHITECTURE.md` | One line: population system (data-driven, no colliders, distance-interaction). |

**Unchanged (explicit):** `Player.tsx`, `Regions.tsx`, `VillageScenery.tsx`,
`villageLayout.ts` (except exporting `distToPaths` if not already), `Actors.tsx`, all puzzle
and store logic, all existing props/paths/colliders.


## Integration checklist

1. Vendor models into `public/models/characters/` + `public/models/wildlife/`; record in
   `asset-manifest.json` (`verified: true` only after in-game load).
2. Author `POPULATION` + `INSECTS` in `src/regions/population.ts`; run
   `scripts/population-check.mts` (off paths, off `BUILDING_HALF` footprints, POI clearance).
3. Implement `PopulationModel` (error boundary, `SkeletonUtils.clone`, mixer, distance-pause,
   wander) and `InsectPoints`.
4. Render `<Population/>` in `GameCanvas.tsx` outside `<Physics>`, inside `<Suspense>`.
5. Extend `interact()` + prompt tick with interactable-entry distance checks (SPOTS win).
6. Verify: one bad model URL renders `null` without crashing; player walks through every
   entry; ≤6 animated models in range; population cost < 5 ms/frame (profile).
7. Update `docs/ARCHITECTURE.md` + manifest `notes`.

## Risks / open questions

- **Asset availability:** the manifest notes "no verified fauna in approved repos." Real animal
  models (deer, rabbit, duck, fox) need a CC0 source (e.g. Quaternius) vendored + audited like
  the characters. Until then, animals can ship as the procedural `Points`/simple-mesh fallback
  and humanoids as KayKit Adventurers variants.
- **Art-style consistency:** mixing KayKit humanoids with Quaternius humanoids in one region
  violates the ≤2-styles rule. Pick one humanoid family for all 6 NPCs.
- **Baked-timeline range playback:** clamping a single embedded clip to a sub-range is fiddly;
  prefer separate-clip assets where possible. If a Gobkit-style model is used, validate the
  loop range in QA before marking `verified`.
- **Hips-Y foot float:** KayKit clips are authored in place with absolute hips Y (~0.38);
  per-character height differences (±10%) can cause slight float/penetration (known from the
  animation audit). Mitigate visually; per-entry Y offset if needed.
- **Wander path-avoidance cost:** `distToPaths` is O(samples); run it at 2 Hz, not per-frame.


