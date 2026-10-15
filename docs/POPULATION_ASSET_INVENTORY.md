# Population Asset Inventory

Inventory of animal/character/prop models in the three approved CC0 GitHub repos, for
populating Eldergrove's regions (village, market, lake, grove, spirit, ruins, tree).
**No models downloaded to the project.** Inventory date: 2026-10-14.

Style baseline: Eldergrove uses **KayKit low-poly stylized** characters
(`public/models/characters/Knight|Mage|Rogue.glb`, ~5.8–7.5k tris, smooth rounded, no baked
clips — driven by the shared `Rig_Medium_*` animation rigs). Player scale reference = 2.54u.
`asset-manifest.json` notes the current **wildlife gap**: no verified fauna in approved repos
(ambient life is shader/particle only). This inventory closes that gap.

Triangle counts are exact (parsed from geometry index accessors). Sizes are on-disk bytes.

---

## A. Quaternius FreeModels (PRIMARY)

Repo: `https://github.com/agentkaerf/FreeModels` (clone verified). All packs **CC0 1.0**
(confirmed in each pack's `License.txt` / `License_Standard.txt` and repo README).
Low-poly glTF by @Quaternius. **Format: all loadable directly by three.js `GLTFLoader` —
no FBX conversion needed.** Individual animals/men/women are **self-contained `.gltf`**
(base64-embedded buffer, single file). Fantasy Outfits are `.gltf` + external `.bin` pairs.
UAL2 is `.glb`.

### A1. Ultimate Animated Animals (`Ultimate Animated Animals - July 2021/`)

12 self-contained `.gltf`, **separate named clips** per file (not a baked timeline).
Tri budget 1.8k–3.7k — the best style match in the inventory to KayKit fauna.

| File | Species | Format | Size | Tri | Animation (separate clips) | License |
|------|---------|--------|------|-----|---------------------------|---------|
| `Alpaca.gltf` | Alpaca (goat-like) | gltf (embedded) | 1.46 MB | 2,060 | 13 clips* | CC0 |
| `Bull.gltf` | Bull | gltf (embedded) | 3.15 MB | 2,418 | 13 clips* | CC0 |
| `Cow.gltf` | Cow | gltf (embedded) | 3.15 MB | 2,450 | 13 clips* | CC0 |
| `Deer.gltf` | Deer | gltf (embedded) | 3.33 MB | 2,098 | 13 clips* | CC0 |
| `Donkey.gltf` | Donkey | gltf (embedded) | 3.61 MB | 2,000 | 13 clips* | CC0 |
| `Fox.gltf` | Fox | gltf (embedded) | 3.21 MB | 1,848 | 13 clips* | CC0 |
| `Horse.gltf` | Horse | gltf (embedded) | 3.66 MB | 2,182 | 13 clips* | CC0 |
| `Horse_White.gltf` | White Horse | gltf (embedded) | 3.65 MB | 2,182 | 13 clips* | CC0 |
| `Husky.gltf` | Husky (dog) | gltf (embedded) | 3.10 MB | 1,920 | 13 clips* | CC0 |
| `ShibaInu.gltf` | Shiba Inu (dog) | gltf (embedded) | 2.93 MB | 1,950 | 13 clips* | CC0 |
| `Stag.gltf` | Stag (antlered deer) | gltf (embedded) | 3.26 MB | 3,670 | 13 clips* | CC0 |
| `Wolf.gltf` | Wolf | gltf (embedded) | 3.22 MB | 1,962 | 13 clips* | CC0 |

`*` Clip set (verified identical across species, from `Deer.gltf`):
`Attack_Headbutt`, `Attack_Kick`, `Death`, `Eating`, `Gallop`, `Gallop_Jump`, `Idle`,
`Idle_2`, `Idle_Headlow`, `Idle_HitReact1`, `Idle_HitReact2`, `Jump_toIdle`, `Walk`.

Notes: Only **hoofed mammals + canines**. **No birds, no rabbits, no aquatic** here.
`Gallop` is the run clip; `Eating`/`Idle_Headlow` are nice ambient grazing/foraging poses.

### A2. Ultimate Modular Men (`Ultimate Modular Men- Feb 2022/Individual Characters/glTF/`)

11 self-contained `.gltf`, **23 separate clips each** (identical set across all).
`How To Use.txt`: individual characters ship with their own rig + animations.

| File | Role | Format | Size | Tri | Animation (23 clips) | License |
|------|------|--------|------|-----|---------------------|---------|
| `Farmer.gltf` | Villager/Farmer | gltf (embedded) | 3.06 MB | 5,476 | 23 clips† | CC0 |
| `Worker.gltf` | Laborer | gltf (embedded) | 3.03 MB | 5,240 | 23 clips† | CC0 |
| `Adventurer.gltf` | Adventurer | gltf (embedded) | 3.74 MB | 10,202 | 23 clips† | CC0 |
| `King.gltf` | King/royal | gltf (embedded) | 3.86 MB | 11,110 | 23 clips† | CC0 |
| `Suit.gltf` | Business/official | gltf (embedded) | 3.38 MB | 7,674 | 23 clips† | CC0 |
| `Casual_Hoodie.gltf` | Casual | gltf (embedded) | 3.17 MB | 6,206 | 23 clips† | CC0 |
| `Casual_2.gltf` | Casual | gltf (embedded) | 3.12 MB | 5,776 | 23 clips† | CC0 |
| `Beach.gltf` | Beach outfit | gltf (embedded) | 3.23 MB | 6,578 | 23 clips† | CC0 |
| `Punk.gltf` | Punk | gltf (embedded) | 3.07 MB | 5,500 | 23 clips† | CC0 |
| `Swat.gltf` | Tactical | gltf (embedded) | 3.43 MB | 8,794 | 23 clips† | CC0 |
| `Spacesuit.gltf` | Spacesuit | gltf (embedded) | 3.78 MB | 10,558 | 23 clips† | CC0 |

`†` Clip set (verified): `Death`, `Gun_Shoot`, `HitRecieve`, `HitRecieve_2`, `Idle`,
`Idle_Gun`, `Idle_Gun_Pointing`, `Idle_Gun_Shoot`, `Idle_Neutral`, `Idle_Sword`, `Interact`,
`Kick_Left`, `Kick_Right`, `Punch_Left`, `Punch_Right`, `Roll`, `Run`, `Run_Back`,
`Run_Left`, `Run_Right`, `Run_Shoot`, `Sword_Slash`, `Walk`, `Wave`.
(`Interact`, `Wave`, `Idle_Neutral`, `Sword_Slash` are the ones a village NPC wants.)

### A3. Ultimate Modular Women (`Ultimate Modular Women - April 2022/Individual Characters/glTF/`)

10 self-contained `.gltf`, same **23-clip set** as Men (verified identical).

| File | Role | Format | Size | Tri | License |
|------|------|--------|------|-----|---------|
| `Medieval.gltf` | Medieval villager | gltf (embedded) | 3.27 MB | 7,276 | CC0 |
| `Adventurer.gltf` | Adventurer | gltf (embedded) | 3.27 MB | 6,812 | CC0 |
| `Witch.gltf` | Witch | gltf (embedded) | 3.27 MB | 6,872 | CC0 |
| `Worker.gltf` | Laborer | gltf (embedded) | 3.16 MB | 6,112 | CC0 |
| `Casual.gltf` | Casual | gltf (embedded) | 3.21 MB | 6,424 | CC0 |
| `Formal.gltf` | Formal | gltf (embedded) | 3.15 MB | 6,108 | CC0 |
| `Suit.gltf` | Business | gltf (embedded) | 3.21 MB | 6,482 | CC0 |
| `Soldier.gltf` | Soldier | gltf (embedded) | 3.41 MB | 7,900 | CC0 |
| `SciFi.gltf` | SciFi | gltf (embedded) | 3.38 MB | 8,038 | CC0 |
| `Punk.gltf` | Punk | gltf (embedded) | 3.13 MB | 5,956 | CC0 |

Tri budget (5.9k–8k) is essentially identical to KayKit (5.8k–7.5k) → **direct style match**.

### A4. Modular Character Outfits — Fantasy (`Modular Character Outfits - Fantasy[Standard]/`)

Free "Standard" subset. Format: **`.gltf` + external `.bin` pairs** (GLTFLoader loads
directly). **0 baked clips** — these are *clothing meshes*, not characters.

| Group | Files | Tri | Notes |
|-------|-------|-----|-------|
| `Outfits/` | `Male_Peasant` (12,894), `Female_Peasant` (13,568), `Male_Ranger` (26,982), `Female_Ranger` (26,966) | 12.9k–27k | Assembled full-body outfits. `Readme.txt`: work with the **Universal Base Character** kit — only the head is visible; full body clips. |
| `Modular Parts/` | 18 part meshes (Body/Arms/Legs/Feet/Head_Hood/Pauldrons for Male/Female Peasant + Ranger) | small | For custom assembly. |
| Textures | `T_Peasant_*`, `T_Ranger_*`, `T_Regular_*` (BaseColor/Normal/ORM) | — | **PBR** (normal + ORM), a higher-fidelity look than KayKit's flat shading. |

**Flag:** (1) No standalone body — requires the *Universal Base Character* kit, which is NOT
in these three approved repos (only sold on quaternius.com). Cannot render a full NPC from
this pack alone. (2) PBR + 13–27k tris = visually denser than KayKit. **Lower priority** —
use the A2/A3 individual characters instead for population.

### A5. Universal Animation Library 2 (`Universal Animation Library 2[Standard]/`)

An **animation library, not a character set.** Format: **`.glb`** (loads directly).

| File | Size | Content |
|------|------|---------|
| `Unreal-Godot/UAL2_Standard.glb` | 8.06 MB | Male mannequin rig carrying **43 named clips** (below). |
| `Female Mannequin/Unreal-Godot/Mannequin_F.glb` | 1.44 MB | Female mannequin, **0 clips** — `README.txt`: retarget from the library (same rig, similar proportions). |

43 clips (verified): `A_TPose`, `Chest_Open`, `ClimbUp_1m_RM`, `Consume`, `Farm_Harvest`,
`Farm_PlantSeed`, `Farm_Watering`, `Hit_Knockback`, `Hit_Knockback_RM`, `Idle_FoldArms_Loop`,
`Idle_Lantern_Loop`, `Idle_No_Loop`, `Idle_Rail_Call`, `Idle_Rail_Loop`, `Idle_Shield_Break`,
`Idle_Shield_Loop`, `Idle_TalkingPhone_Loop`, `LayToIdle`, `Melee_Hook`, `Melee_Hook_Rec`,
`NinjaJump_Idle_Loop`, `NinjaJump_Land`, `NinjaJump_Start`, `OverhandThrow`, `Shield_Dash_RM`,
`Shield_OneShot`, `Slide_Exit`, `Slide_Loop`, `Slide_Start`, `Sword_Block`, `Sword_Dash_RM`,
`Sword_Regular_A/_B/_C/_Combo` (+`_Rec`), `TreeChopping_Loop`, `Walk_Carry_Loop`, `Yes`,
`Zombie_Idle_Loop`, `Zombie_Scratch`, `Zombie_Walk_Fwd_Loop`.

**Flag:** Clips are on a Quaternius mannequin rig, **not** the KayKit `Rig_Medium` rig.
Useful clips for a village (e.g. `Farm_Harvest`, `Farm_PlantSeed`, `Farm_Watering`,
`TreeChopping_Loop`, `Consume`, `Yes`, `Idle_Lantern_Loop`) would need **retargeting** to
Eldergrove's character rig before use. Not drop-in.

### Quaternius summary
- **GLB vs conversion:** none need conversion. Animals/Men/Women = self-contained `.gltf`
  (embedded buffer); Fantasy Outfits = `.gltf`+`.bin`; UAL2 = `.glb`. All direct `GLTFLoader`.
- **Best for Eldergrove:** A1 animals + A2/A3 individual characters (style + tri match).
- **Weaker:** A4 (needs external base character + PBR look), A5 (retargeting required).

---

## B. Gobkit Free Assets (SECONDARY)

Repo: `https://github.com/Ariescar/gobkit-free-assets` (clone verified). **CC0 1.0**
(full legal text in `LICENSE`). Game-ready **GLB** — rigged, animated, texture baked into
each file, no attribution. Packs: `minion/` (8), `animal/` (10), `nature/` (41 + scene).

### B1. `animal/` — 10 animals

Each `.glb` is **self-contained** (texture baked in, shared `Texture001.png` atlas also
shipped). **One single baked `clip` track** per model, **24 fps**, documented as 30-frame
segments (from `README.md`/`INTEGRATION.md`, read carefully):

| Clip | Frames | Loop? | Reliability |
|------|--------|-------|-------------|
| `idle` | 0–29 | loop | ✅ in range |
| `attack` | 30–59 | loop | ✅ in range |
| `dead` | 60–89 | **play once, hold** | ✅ in range |
| `walk` | 90–119 | loop | ⚠️ see below |

**Animation handling (from `INTEGRATION.md` §2):** Do **not** use `THREE.AnimationUtils.subclip`
for looping clips (its `resetDuration()` truncates on sparse keys and pops the loop). Instead
play the whole clip and **scrub with `mixer.setTime(start + (local % dur))`**. Bind pose
faces **+Z** (rotate a parent pivot to reorient). Raw scales are non-uniform → normalize each
to a target height. For instancing skinned meshes use `SkeletonUtils.clone()` (plain
`.clone()` breaks skinning) and set `frustumCulled = false`.

⚠️ **Walk-segment discrepancy (verified):** the documented `walk` segment is frames 90–119
(= 3.75–5.0 s), but the **baked timeline only spans 0.00–4.33 s (~104 frames)** with just
24 sparse keyframe times. Frames ~105–119 of "walk" fall past the last keyframe → that part
**holds the final frame**. `idle`/`attack`/`dead` (0–3.71 s) are safe. Treat `walk` as
best-effort; `idle`/`attack` are the reliable clips.

| File | Species | Format | Size | Tri | Animation | License |
|------|---------|--------|------|-----|-----------|---------|
| `Anglerfish.glb` | Anglerfish (deep-sea fish) | glb (baked) | 56.3 KB | 266 | 1 baked clip | CC0 |
| `Bat.glb` | Bat (flying) | glb (baked) | 61.8 KB | 376 | 1 baked clip | CC0 |
| `Corgi.glb` | Corgi (dog) | glb (baked) | 71.8 KB | 508 | 1 baked clip | CC0 |
| `Duck.glb` | Duck (waterfowl) | glb (baked) | 68.4 KB | 508 | 1 baked clip | CC0 |
| `Hippo.glb` | Hippo | glb (baked) | 64.7 KB | 382 | 1 baked clip | CC0 |
| `Jellyfish.glb` | Jellyfish (drifting) | glb (baked) | 65.4 KB | 428 | 1 baked clip | CC0 |
| `Platypus.glb` | Platypus | glb (baked) | 72.8 KB | 504 | 1 baked clip | CC0 |
| `Red.glb` | Reddish quadruped, fox/coyote-like [INFERENCE from rig: 4 legs + tail + ears + hands] | glb (baked) | 75.3 KB | 470 | 1 baked clip | CC0 |
| `Rhino.glb` | Rhino | glb (baked) | 68.7 KB | 464 | 1 baked clip | CC0 |
| `Shark.glb` | Shark (water) | glb (baked) | 60.2 KB | 286 | 1 baked clip | CC0 |

Tri budget (266–508) is far **lower** than Quaternius fauna (1.8k–3.7k) — very stylized/
cartoonish. Fine for ambient wildlife, but noticeably simpler than KayKit.

### B2. `nature/` — 41 static environment props + 1 assembled scene
Static (no rig), very low poly (7–70 tris). Trees (High/Low/Med ×3), rocks, cliffs, hills,
hills-sand, mountains, mountain-far, clouds, grass, reeds, bushes, stalactites, plus
`nature-kit-scene.glb` (1,091 tris). GLB, baked texture. Good supplementary foliage/terrain.

### B3. `minion/` — 8 low-poly enemy characters
`minion-{a,b,c,d}{01,02}.glb`, 240 tris each, one baked `movement` clip (90 keys / 30-frame
segments: idle/attack/dead). Cartoonish enemies; style simpler than KayKit.

### Gobkit summary
- **Format:** all self-contained `.glb`, baked texture → direct `GLTFLoader`, no external deps.
- **Animation:** baked single-clip timeline with frame-range segments (not separate clips).
  Use `mixer.setTime` scrubbing; `dead` is one-shot. **Walk segment partially exceeds the
  baked timeline** (4.33 s) — reliable clips are idle/attack/dead.
- **Best for Eldergrove:** `Duck`, `Jellyfish`, `Bat`, `Red` (ambience) — species Quaternius
  lacks (aquatic/flying/odd). No deer/rabbit/bird/fox here (Fox ≈ the `Red` creature at best).

---

## C. Kenney GitHub Mirror (SUPPORT)

Repo: `https://github.com/shorepine/kenney` (clone verified). **CC0** (`LICENSE.txt`, e.g.
"Castle Kit (2.0)… Creative Commons Zero, CC0"). This is a **mirror/flat reorg** of the full
Kenney library: `2d/` (35,998 PNGs), `ui/`, `icons/`, `3d/` (4,812 GLB across 49 kits),
`index.tsv`, `3d/kits.tsv`.

**Key constraint (from README):** the 3D kits are **static** — "excluded: … FBX-only
skinned-character kits (the consumer is a static flat-shading rasterizer)." So most Kenney
3D is **unrigged environment/prop geometry**. A few **GLB character kits do carry animations**
(verified below). All 3D are `.glb` with textures beside them (relative URI, e.g.
`Textures/colormap.png`), loading directly.

Relevant kits (full kit list in `3d/kits.tsv`, 49 kits):

| Kit | Models | Content | Format / Anims | License |
|-----|--------|---------|----------------|---------|
| `fantasy-town` | 167 | Village dressing: `wall-*` (wood/stone), `wall-window-*`, `wall-wood-door*`, `fence*`, `hedge*`, `fountain-*` (round/square/curved), `lantern`, `banner-red/green`, `windmill`, `watermill`, `cart`, `cart-high`, `chimney*`, `planks*`, `pillar-stone/wood`, `wheel`, `blade`, `overhang` | glb, **static** | CC0 |
| `mini-market` | 20 | Market: `display-fruit`, `display-bread`, `shelf-bags/boxes/end`, `shopping-cart`, `shopping-basket`, `cash-register`, `freezer(s)`, `floor`, `column`, `fence-door-rotate`, **`character-employee`** | glb; `character-employee` = **28 clips** (idle/walk/sprint/jump/fall/crouch/sit/die/pick-up/emote-yes/no/attack-*/interact-*/holding-*/wheelchair-*); props static | CC0 |
| `nature` | 329 | Landscape: `bridge_*` (wood/stone, many variants), `campfire_*`, `canoe`, `canoe_paddle`, `cliff_*` (many), `rock*`, water, plants | glb, **static** | CC0 |
| `graveyard` | 91 | Ruins/ghost: gravestones, altar-stone, fences, crypts | glb, **static** | CC0 |
| `retro-fantasy` | 105 | Fantasy props (barrels, etc.) | glb, static | CC0 |
| `castle` | 76 | Castle blocks | glb, static | CC0 |
| `blocky-characters` | 18 | `character-a…r`, blocky humanoid | glb, **27 clips each** (static/idle/walk/sprint/sit/drive/die/pick-up/emote-yes/no/holding-*/attack-*/interact-*/wheelchair-*), 72 tris | CC0 |
| `mini-characters` | 26 | Miniature humanoids (e.g. `aid-cane-blind`) | glb, **static** (0 clips) | CC0 |
| `food` | 200 | Market food items | glb, static | CC0 |
| `furniture` | 140 | Indoors/props | glb, static | CC0 |

**Style flag:** Kenney is low-poly stylized but **boxier / flat-shaded** than KayKit's
smooth rounded forms. The animated `blocky-characters` (72 tris, cube faces) and
`character-employee` read as a *different character style* than KayKit — usable, but they
will not visually blend with Knight/Mage/Rogue. Kenney is best treated as a **prop/dressing
supplement**, not a character source.

### Kenney summary
- **Format:** `.glb` + sidecar textures, direct load. Mostly **static**; a few animated
  character kits exist (blocky, mini-market employee).
- **Best for Eldergrove:** `fantasy-town` + `nature` + `graveyard` + `mini-market` props for
  village/market/ruins/lake dressing. **Not** a primary character source (style mismatch).

---

## Recommendations by Eldergrove Region

Guidance: **Quaternius individual characters + animals** are the style/tri-budget match for
KayKit and should be the primary population. **Gobkit** fills the species Quaternius lacks
(aquatic, flying, odd creatures) but at lower detail and with the walk-timeline caveat.
**Kenney** is a prop/dressing supplement only. **Retargeting** is the one non-trivial cost
(Quaternius UAL2 clips → KayKit rig).

### Village (entrance → center → market → residential → castle)
- **NPCs:** Quaternius **Men** `Farmer`, `Worker`, `King`, `Suit`, `Adventurer` + **Women**
  `Medieval`, `Worker`, `Casual`, `Adventurer`, `Formal`. Style/tri match (5.2k–11k tris vs
  KayKit 5.8k–7.5k), 23 clips incl. `Walk`/`Run`/`Idle_Neutral`/`Interact`/`Wave`/`Sword_Slash`.
  These are the drop-in villagers.
- **Animals:** Quaternius `Fox`, `Husky`, `ShibaInu` (dogs), `Horse`/`Horse_White`, `Cow`/
  `Bull` (livestock), `Alpaca` (herd). `Eating`/`Idle_Headlow` clips give ambient grazing.
- **Dressing:** existing KayKit village props + **Kenney `fantasy-town`** (fences, hedges,
  lanterns, banners, fountain, windmill) as a boxy supplement if more variety is wanted.
- **Reasoning:** Quaternius characters are the only source that blends with KayKit at a
  matching tri budget; Kenney characters would break the look.

### Market
- **NPCs:** Quaternius `Suit` (Men), `Formal`/`Suit`/`Casual`/`Medieval` (Women) as merchants.
- **Stalls:** **Kenney `mini-market`** (`display-fruit`, `display-bread`, `shelf-*`,
  `shopping-cart`, `cash-register`) + `food` (200 items). Kenney props are the only dedicated
  market-stall set here.
- **Optional:** Kenney `mini-market/character-employee` (28 clips) if a shopkeeper with its
  own walk/idle is wanted and the boxier look is acceptable — otherwise use a Quaternius NPC.
- **Reasoning:** Quaternius for the people, Kenney for the wares; no animals needed.

### Lake
- **Fauna:** **Gobkit `Duck`** (the best waterfowl fit — the only duck/pond bird available),
  `Jellyfish`, `Anglerfish`/`Shark` (deeper water), `Platypus`. Quaternius has **no aquatic
  species**, so Gobkit is the only lake-fauna source.
- **Dressing:** Kenney `nature` (`canoe`, `canoe_paddle`, `bridge_*`, `water`, reeds) +
  existing KayKit env (lake water is already shader/particle).
- **Reasoning:** Gobkit fills a real gap (no aquatic in Quaternius); use `idle` (swim bob),
  treat `walk` as unreliable per the timeline caveat.

### Grove / Forest
- **Fauna:** Quaternius `Deer`, `Stag`, `Fox`, `Wolf`, `Husky` — the core forest wildlife,
  best style match. `Gallop`/`Walk`/`Idle` clips.
- **Flying:** **Gobkit `Bat`** for nocturnal/ambient flyers (Quaternius has no birds/bats).
- **Dressing:** existing KayKit trees + **Kenney `nature`** (rocks, cliffs, campfires) if needed.
- **⚠️ Gap: no rabbits and no birds** in any of the three repos. Rabbits are absent from
  Quaternius (only hoofed + canines) and Gobkit. Birds are absent from all three. If
  rabbit/bird population is required, it must come from a new source or shader/particle
  stand-ins (the current approach).
- **Reasoning:** Quaternius gives the matching forest quadrupeds; Gobkit adds the bat.

### Spirit
- **Creatures:** **Gobkit `Jellyfish`** (drifting, ethereal) + `Bat` (ghostly) are the most
  spirit-appropriate silhouettes available. These are low-poly and could be recolored
  (material override) for a glowing spirit look.
- **⚠️ No dedicated spirit/ghost model** in any repo. Recommend shader/emissive treatment on a
  Gobkit creature (or the existing particle approach) rather than a rigid model swap.
- **Reasoning:** neither repo has an overt "spirit" asset; pick the most translucent-feeling
  Gobkit creature and style it with materials.

### Ruins
- **Dressing:** **Kenney `graveyard`** (91: gravestones, `altar-stone`, crypts, fences) —
  the dedicated ruins/cemetery set; plus `retro-fantasy` and `nature` (cliffs, rocks).
  Existing KayKit `rubble_large`, `grave_a`, `gravestone` props already present.
- **Ambient:** Quaternius `Wolf` for ruined-locale wildlife.
- **Reasoning:** Kenney graveyard is the only purpose-built ruins kit; static (no anims) but
  that's fine for set dressing.

### Tree (giant tree / tree-top)
- **Fauna (tree-top):** Quaternius `Fox`/`Husky`/`Wolf` at the base; **Gobkit `Bat`** for
  canopy ambience.
- **Dressing:** existing KayKit large trees; **Kenney `nature`** `Tree*` variants are small
  (34 tris) — not suitable as a *giant* tree, only ground cover.
- **⚠️ No large/giant tree model** in the new repos. The existing KayKit tree assets remain
  the source for any giant-tree geometry.
- **Reasoning:** new repos don't add a usable giant tree; they add creatures to dress around
  the existing KayKit tree.

### Cross-region flags / blockers
- **Missing species (all three repos):** **rabbits** and **birds** — not present anywhere.
  Aquatic only in Gobkit. Keep shader/particle stand-ins for these until a new source is approved.
- **Quaternius A4 (Fantasy Outfits):** needs the *Universal Base Character* kit (not in
  approved repos) + PBR look → **skip** for population; use A2/A3 individuals.
- **Quaternius A5 (UAL2):** clips live on a Quaternius mannequin rig, not the KayKit
  `Rig_Medium` rig → **retargeting required** before clips can drive Eldergrove NPCs. The
  farm/lantern/throw clips are the valuable ones.
- **Gobkit walk segment:** baked timeline ends at 4.33 s, so `walk` (frames 90–119) holds
  past its last keyframe → **use `idle`/`attack` (and one-shot `dead`) as the reliable clips**;
  scrub with `mixer.setTime`, normalize scale, `SkeletonUtils.clone` for instances.
- **Kenney characters:** boxier/flat than KayKit → **props yes, characters no** (style mismatch).
- **License:** all three confirmed **CC0 1.0** — no attribution required (welcome but optional).
