# FANTASY FOREST — THE LOST REALM
## Master Product, Game Design, Engineering & Delivery Specification
**Version:** 1.0 | **Date:** 2026-10-08 | **Target:** Free-to-play static browser game hosted on Vercel Hobby

> **Instructions to coding agent:** Treat this document as the authoritative product brief. Build a working, polished, playable project, not a mockup, slide deck, static landing page, or collection of disconnected demos. Audit the actual repository and assets before coding. If a requested asset, license, or animation cannot be verified, report it explicitly and select a verified equivalent within the same chosen art ecosystem; never silently invent files, features, or completion. Deliver incremental working builds and a final deployment-ready repository. Do not claim tests or deployment succeeded unless verified.

---

## 1. Product vision
Build **Eldergrove: The Lost Realm**, a visually striking, cohesive, stylized 3D fantasy forest adventure for desktop and mobile browsers. Players first enter a cinematic welcome screen, **enter a display name and select a real 3D character**, then explore a living miniature open world, meet a magical spirit companion, solve environmental puzzles, recover Spirit Fragments, and restore the Ancient Tree. Optimize for a memorable first five minutes and a shareable Vercel URL. Gameplay is exploration-first, accessible, nonviolent, and approachable for casual players.

**Experience pillars:** (1) cohesive KayKit visual identity; (2) visible and satisfying environmental interactions; (3) seamless third-person movement; (4) animated wildlife and magical ambience; (5) short, complete quest arc; (6) fast browser loading; (7) free static hosting.

**Product constraints:** No paid dependencies, subscriptions, API keys, paid hosting, mandatory authentication, online multiplayer, or backend required for the first release. Client-side game and local save are sufficient. Use only verified redistributable assets. Target a complete 15–25 minute experience; release a 5-minute vertical slice first.

## 2. Non-negotiable asset strategy
Use **the three selected KayKit collections as the primary and consistent art ecosystem**:
1. Environments: https://github.com/GeorgeQLe/assets-kaykit-3d-environments
2. Characters: https://github.com/GeorgeQLe/assets-kaykit-3d-characters
3. Props: https://github.com/GeorgeQLe/assets-kaykit-3d-props

These are third-party collection repositories, not necessarily official publisher repositories. **Before any use:** inspect actual repository trees, individual packs, file paths, format availability, provenance and license files. Confirm CC0 (or other explicitly approved compatible permission) **for each used pack/file**. Record attribution/provenance even if attribution is not required. If unavailable, blocked, Git LFS pointers, or missing, flag the blocker; do not substitute unrelated Quaternius/FreeModels assets without user approval. Do not fetch from Quaternius, Kenney, itch.io, or blocked websites. Use ordinary GitHub HTTPS; download only needed folders/files where feasible, use sparse checkout when useful, never execute unknown repository scripts. Respect company network policies.

Create `asset-manifest.json` with: `id`, `category`, `repository`, `sourcePath`, `localPath`, `format`, `license`, `licenseEvidencePath`, `author`, `scale`, `animations`, `usage`, `optimizedBytes`, `verified`. Keep licenses and notices in `public/licenses/` or `docs/licenses/`. Never infer that a character named Knight/Mage/Rogue exists: inspect the actual collection and choose **three real selectable character models**; display their actual appropriate names or thematic labels tied to verified files. Never present images of hypothetical models as proof of real GLBs. If available assets do not include a required creature/building, report a clear gap and adapt the level design without ugly primitives or unlicensed downloads.

**Style guide:** whimsical low-poly/stylized, readable silhouettes, rounded foliage, warm amber lanterns, forest greens, subdued teal and purple magical accents, soft atmospheric fog. Consistent world units, lighting, materials, texture treatment, outline/shading, shadow softness and object scale. No fake cone trees, mismatched realistic assets, or random primitive scenery. Simple invisible collider meshes are allowed.

## 3. Game flow and onboarding
State machine:
`BOOT -> ASSET_PRELOAD -> WELCOME -> CHARACTER_CREATION -> INTRO_CINEMATIC -> PLAYING -> PAUSED -> ENDING`, with `CONTINUE` and `NEW_GAME` branches.

### Welcome
- Animated forest scene or lightweight optimized background, logo `ELDERGROVE — THE LOST REALM`, `New Adventure`, `Continue Adventure` (only if save exists), Settings, Credits.
- Progress indication during preload; never freeze or show blank canvas.
- Audio starts only after explicit user interaction to respect browser autoplay restrictions.

### Character creation (mandatory on first play)
- Headline `Create Your Adventurer`; display name field, trimmed 1–20 characters; allow Unicode letters; reject blank, control characters, and excessive length; escape all user text safely.
- At least three **verified** distinct KayKit character models, if the inspected pack contains them; otherwise show available real options and report the shortfall.
- Real interactive 3D GLB/glTF preview, 360-degree drag/rotate, idle animation if present, name/description, selection highlight, responsive touch interaction.
- Do not invent class combat stats. Choices are cosmetic only, including consistent movement, puzzles and progression.
- `Enter the Forest` is disabled until valid name + loaded selected character; handle load errors with explicit recovery UI.
- Enter via short skippable 5–10 second camera cinematic, then spawn at Forest Village; display movement/tutorial prompts.
- Persist profile separately from progress. Returning user sees Continue/New Adventure; offer profile edit in settings without destroying progress.

### Suggested local save schema
```json
{
  "schemaVersion": 1,
  "profile": {"displayName": "Ray", "characterId": "verified-character-id"},
  "progress": {"regionId": "forest_village", "spawnId": "village_entrance", "completedQuests": [], "solvedPuzzles": [], "spiritFragments": 0, "worldRestored": false},
  "settings": {"quality": "auto", "musicVolume": 0.5, "sfxVolume": 0.7, "reducedMotion": false},
  "updatedAt": "ISO-8601"
}
```
Use namespaced localStorage key `eldergrove.save.v1`, schema validation, migration strategy, graceful corrupted-save recovery, explicit Reset Save confirmation and autosave at meaningful checkpoints. Do not trust localStorage as secure or cross-device storage.

## 4. World layout and level design
The world is a **compact connected hub-and-spoke miniature open world**, not a gigantic empty procedural landscape. Build navigable roads, strong silhouettes, landmarks, soft guiding lights, natural barriers, return loops, and scenic viewpoints.

**Map (conceptual, not exact scale):**
```
                  [ANCIENT TREE]
                        |
 [CRYSTAL LAKE] -- [FOREST VILLAGE] -- [WHISPERING RUINS]
                        |        
                [WOODLAND TRAIL] ---- [MUSHROOM GROVE]
                        |
                  [SPAWN GATE]
```
All regions must connect by traversable routes with reasonable navigation, clear landmarks and no accidental dead ends.

| Region | Visual identity | Interactive content | Progression |
|---|---|---|---|
| Spawn Gate / Woodland Trail | canopy, bridge, stream, flowers, fireflies | movement tutorial, secret trail | onboarding |
| Forest Village | warm wooden buildings, lanterns, NPCs, fountain | quest board, dialogue, hub map | home base |
| Mushroom Grove | giant luminous mushrooms, mist, jumping platforms | Spirit Path or light platforming | first fragment |
| Crystal Lake | luminous blue crystals, lake, stone pillars | Rune Sequence | second fragment |
| Whispering Ruins | mossy columns, ancient gate, runes | Light Reflection | third fragment |
| Ancient Tree | monumental roots, shrine, canopy | restore ritual, world transformation | ending |

**Scope discipline:** In the first vertical slice implement Spawn Gate, Village, and Mushroom Grove with one fully finished quest and one visible world transformation. Remaining regions follow only after performance and UX pass.

## 5. Movement, camera and physics
- Third-person character controller with smooth acceleration/deceleration, ground detection, gravity, step/slope handling, collision, jump and optional sprint; no slipping or falling through terrain.
- Desktop: WASD/arrow keys move; mouse orbit; Shift sprint; Space jump; E interact; M map; Q spirit ability; Esc pause. Show configurable key hints.
- Mobile: virtual left joystick, right-side drag camera, touch Jump/Interact/Sprint/Spirit; safe-area support; avoid browser scroll while playing; adequate touch target sizes.
- Camera: smooth follow/orbit, configurable sensitivity, sensible min/max pitch, collision avoidance, occlusion handling, reset camera action; never clip through buildings.
- Stable physics fixed time step; avoid framerate-dependent motion. Disable gameplay input during menus/cinematics.
- Accessible focus management and keyboard navigability for menus.

## 6. Quests, puzzles and progression
Core loop: **explore -> discover -> interact -> solve -> collect Spirit Fragment -> change world -> unlock final restoration**.

**Main quest:** `The Forest Remembers`: speak with the forest spirit, recover three fragments from Mushroom Grove, Crystal Lake and Whispering Ruins, restore Ancient Tree. Keep dialogue short, atmospheric and skippable. Quest journal, objective tracker, interact prompt, success feedback and checkpoint autosave.

**Puzzle A — Spirit Path (Mushroom Grove):** observe glowing spirit footprints, activate floor stones in sequence, reset clearly after a mistake, allow replay, accessible non-color-only clues. First puzzle in vertical slice.

**Puzzle B — Rune Sequence (Crystal Lake):** observe four runes' sound/light sequence; interact in order; readable replay clue; feedback and reward.

**Puzzle C — Light Reflection (Ruins):** rotate verified crystal/mirror props, align beam toward sealed gate, visually clear beam feedback; provide fallback visual indicator for lower graphics quality.

Puzzles must have deterministic completion conditions, hints after inactivity, saveable solved state, and no unwinnable conditions. Fragments are quest collectibles, not monetized currency. Cosmetic character choice does not affect puzzle accessibility.

## 7. Living world and unique features
1. **Spirit Companion:** floating guide (only if a compatible verified model exists, otherwise a restrained shader/particle effect for an ethereal light, not a fake character model); follows player, points to objectives, gives contextual hints. Implement finite-state machine (idle/follow/guide/celebrate), no AI API.
2. **Day/Night:** smoothly varying directional/ambient light, fog tint, sky, lantern and emissive accents; avoid costly realtime GI. Pause/time controls optional in photo mode.
3. **Wildlife:** add only verified, visually compatible animated models available in approved sources; idle/wander/flee state machines, proximity activation, bounded movement, animation LOD. Do not assert KayKit packs include specific species without inspection.
4. **World Restoration:** solving quests visibly transforms selected trees/flowers/light/ambient sound; restoration finale uses a short cinematic, particles and music cue.
5. **Photo Mode:** hide HUD, free/orbit camera within safe limits, preset framing, day/night controls where performant, browser screenshot export via canvas where supported; handle CORS/tainted canvas correctly.
6. **Secrets:** a handful of discoverable scenic locations and optional collectibles; no procedural filler.
7. **Audio:** royalty-free/appropriately licensed ambient forest, water, footsteps, interaction cues, music; record each audio license. User-controlled mute and volume.

## 8. UI/UX specification
Visual language: dark pine (#15251e), deep forest (#1e3027), gold (#d8bb78), parchment (#f4e9c9), pale sage (#b7c6b8), magical teal. Maintain contrast and readability; do not rely on color alone.

Screens: Welcome, Character Creation, Loading, HUD, Dialogue, Quest Journal, World Map, Inventory/Fragments, Pause, Settings, Photo Mode, Ending, Credits. HUD should be restrained: current objective, interaction prompt, fragment counter, minimap/compass only if genuinely useful. Support desktop 16:9, narrow mobile portrait and landscape; recommend landscape on very narrow devices without blocking access. UI transitions 150–300ms; respect reduced-motion preferences. Graceful WebGL unsupported/context-lost messaging. No blocking modals during normal gameplay.

## 9. Technical stack and architecture
- Vite + React + TypeScript (strict) for a static SPA.
- `three`, `@react-three/fiber`, `@react-three/drei` for rendering/GLTF/animation/camera helpers.
- `@react-three/rapier` for physics.
- Zustand for UI, player profile, progress, quests and settings (do not update React global state every animation frame).
- Howler.js or Web Audio for sound; select one based on implementation needs.
- ESLint + Prettier + TypeScript checks; Vitest for pure gameplay/save logic; Playwright optional for browser smoke tests.
- No Next.js, database, server, authentication, external paid services or AI inference in MVP.

Suggested modules:
```
public/{models,textures,audio,licenses}/
src/
  app/{App,Routes,ErrorBoundary}/
  game/{GameCanvas,World,GameLoop,PlayerController,ThirdPersonCamera}/
  regions/{Village,MushroomGrove,CrystalLake,Ruins,AncientTree,Trail}/
  entities/{NPC,SpiritCompanion,Wildlife,Interactable}/
  systems/{QuestSystem,PuzzleSystem,InteractionSystem,SaveSystem,AudioSystem,QualityManager}/
  puzzles/{SpiritPath,RuneSequence,LightReflection}/
  ui/{Welcome,CharacterCreation,HUD,Dialogue,Map,Pause,Settings,PhotoMode,Ending}/
  stores/{profileStore,progressStore,settingsStore}/
  data/{characters,regions,quests,interactables}/
  utils/{assetLoader,saveSchema,performance}/
asset-manifest.json
docs/{ASSET_AUDIT,ARCHITECTURE,TEST_PLAN,DEPLOYMENT,KNOWN_LIMITATIONS}.md
```
Adapt structure to existing repo; don't create empty abstraction layers or unnecessary boilerplate.

**Technical safeguards:** dispose unused GPU resources; avoid duplicate scene ownership; avoid mutable shared GLTF scene objects across multiple independent instances (clone/`SkeletonUtils` for skinned meshes); prefer instancing for static repeated foliage; ensure skinned mesh animations and materials survive GLB optimization; never mutate original licensed assets destructively without keeping provenance. Use error boundaries for UI and explicit loading/error states for 3D assets.

## 10. Performance and quality budgets
Targets, not guarantees: desktop 60 FPS on representative midrange hardware; mobile 30 FPS on representative supported devices; first interactive experience under 10 seconds on a reasonable connection with cached/reduced initial asset set. Establish measured baseline and record hardware, browser, network and graphics settings. Never claim universal FPS guarantees.

- Lazy-load regions; preload only Welcome/Character Creation and spawn assets; show loading progress and cache safely.
- Use GPU instancing for repeated trees/rocks/grass; mesh LOD/culling and region chunks; minimize draw calls and material variants.
- Optimize textures (KTX2 where practical), GLB with Meshopt/Draco when supported, limit shader complexity and particle counts.
- Use baked/static light where practical, one primary shadow caster, capped shadow resolution, low-cost fog and water.
- Automatic quality presets Low/Medium/High with manual override. Low reduces foliage density, shadow quality, effects and render pixel ratio; never changes collision, quest logic or puzzle fairness.
- Wildlife AI updates only near player; reuse animations and geometry; monitor JS heap and GPU memory on long sessions.
- Set meaningful size budgets after measuring actual selected assets; do not arbitrarily compress animated characters until broken.

## 11. Accessibility, safety and reliability
- Menus fully usable via keyboard, labels on controls, visible focus, readable font sizes and contrast.
- Reduced motion option, volume sliders, mute, color-independent puzzle cues, clear subtitles for important dialogue/audio hints.
- Sanitize displayed player names; do not insert HTML; no unsafe dynamic eval or untrusted scripts.
- Handle offline/slow network, asset failures, WebGL context loss, corrupted local save, touch orientation changes and tab suspension.
- Avoid analytics/tracking unless explicitly approved; no account or personal data collection.

## 12. Free Vercel deployment
Static Vite deployment only; no server processes, databases or paid APIs. Source on GitHub, deploy via Vercel Hobby for personal non-commercial use within applicable plan quotas and terms. Set framework Vite, build command `npm run build`, output directory `dist`, install command `npm install`. Commit lockfile. Use HTTPS, default `*.vercel.app` domain. Avoid oversized public asset bundles; use chunking and caching. Validate direct navigation/reload, asset path case sensitivity, mobile, network requests, console errors and 404 behavior on production URL. Do not assume quotas are unlimited or that deployment succeeded until verified.

Local bootstrap (adapt to existing repo):
```bash
npm create vite@latest fantasy-forest -- --template react-ts
cd fantasy-forest
npm install
npm install three @react-three/fiber @react-three/drei @react-three/rapier zustand howler
npm install -D @types/three @types/howler
npm run dev
npm run build
```
Check package versions for compatibility before installation; pin stable compatible versions in lockfile.

## 13. Delivery phases and gates
**Phase 0 — Discovery and asset audit (mandatory):** inspect selected three GitHub repositories, license evidence, formats, actual character options, animation clips and available environment props; build manifest; report gaps and exact filenames. Verify feasibility before coding.

**Phase 1 — Technical foundation:** Vite/TS/R3F/Rapier, canvas, camera, stable controller, loading/errors, basic game state, local save, automated build.

**Phase 2 — Character onboarding:** welcome, real three-character preview if verified, name validation, persistent profile, intro cinematic, returning-player continue/new game.

**Phase 3 — Vertical slice:** village + trail + mushroom grove, cohesive environment, one NPC/companion, Spirit Path puzzle, fragment, transformation, save/continue, desktop/mobile controls.

**Phase 4 — World expansion:** lake, ruins, Ancient Tree, remaining puzzles, quest progression, ending.

**Phase 5 — Polish:** lighting/day-night, compatible wildlife, particles, sound, photo mode, accessibility, optimization and quality presets.

**Phase 6 — Release:** tests, licensing inventory, clean build, preview deploy, production verification, documentation, known limitations.

At every phase deliver: working state, changed files, asset provenance, screenshots or captured evidence where possible, tests run with real results, known blockers and next steps. Do not replace real features with mockup-only implementations while claiming completion.

## 14. Acceptance tests
### Character and saves
- [ ] First-time user sees Welcome and mandatory name/character creation.
- [ ] Character preview uses verified GLB model, correct materials, idle animation when available, rotate/zoom and touch.
- [ ] Empty/invalid names cannot start; 1–20 character valid names persist safely.
- [ ] Selected in-game model matches preview; animation and clothes/materials render correctly.
- [ ] Reload offers Continue; progress restored; New Game resets only after confirmation.
- [ ] Corrupted or old save recovers without crashing.

### Gameplay and world
- [ ] WASD/mouse and mobile touch controls work, including collision, jump and interaction.
- [ ] Player cannot pass through solid world geometry or fall through navigable ground.
- [ ] Village/trail/mushroom vertical slice is fully traversable and visually cohesive.
- [ ] Quest can be accepted, tracked, completed, rewarded and saved.
- [ ] Spirit Path puzzle has clear hints, failure/retry and deterministic success.
- [ ] Completing quest visibly changes world state and remains changed after reload.
- [ ] All expanded regions, puzzles and finale work end-to-end before full release is claimed.

### Technical and delivery
- [ ] All imported assets have verified license evidence and manifest entries.
- [ ] No missing GLBs, textures, animations, unresolved imports, 404s or silent placeholders.
- [ ] `npm run build` and TypeScript check pass; key save/puzzle tests pass.
- [ ] Browser smoke test passes on desktop and mobile viewport; performance measured and documented.
- [ ] Production Vercel URL loads, plays, reloads and serves all required static assets.
- [ ] No paid services, secrets or backend required for core gameplay.

## 15. Agent execution rules and output contract
1. First inspect existing files/repo and confirm whether this is a new project or integration; preserve existing unrelated code.
2. Read and audit **only the three selected KayKit GitHub collections**; do not claim verified files until examined. Prefer HTTPS, sparse checkout, selective downloads, no unknown scripts.
3. Produce `docs/ASSET_AUDIT.md` with exact selected files and evidence. If blockers exist, explicitly state what cannot be delivered and ask only when a product decision is essential.
4. Produce a concrete implementation plan mapped to the phases; then implement continuously, validating after each phase. Do not stop at planning unless blocked by missing permissions/assets.
5. Prioritize fully playable vertical slice over sprawling incomplete map. Use real GLBs and real animations; never fake trees, characters or buildings with primitives.
6. Do not introduce gameplay-altering optimization, class differences or monetization without approval.
7. Never commit copyrighted assets with unverifiable rights, API keys, private files or massive unused asset collections.
8. Do not falsely report completed features, test results, deploy URLs or licenses.
9. Final report must include: features completed, exact selected asset files and licenses, how to run, how to deploy, test evidence, performance measurements, remaining gaps, and next recommended iteration.

## 16. First action for the agent
**Begin with Phase 0:** inspect the three GitHub repositories, inventory actual KayKit environment/character/prop packs and file formats, verify each selected asset's license, identify at least three genuine character choices and their animations if present, and write `docs/ASSET_AUDIT.md` plus `asset-manifest.json`. Then establish the React/Vite game scaffold and build the first playable onboarding + village vertical slice. Continue through phases while keeping the project runnable.

---
**End of specification.**
