# Eldergrove — Asset Audit (Phase 0)

**Date:** 2026-10-08 | **Auditor:** OpenCode agent | **Spec:** FANTASY_FOREST_MASTER_SPEC.md v1.0

All three mandated KayKit collection repositories were inspected live via GitHub web + `manifest.json` raw fetch. No files invented; paths below are verbatim from manifests.

## Repositories

| # | Collection | URL | Total assets | License (manifest + LICENSES/) | Evidence |
|---|---|---|---|---|---|
| 1 | Environments | https://github.com/GeorgeQLe/assets-kaykit-3d-environments | 18363 | CC0-1.0 | `manifest.json` every entry `license: CC0-1.0`; `LICENSES/KayKit-CC0-License.txt` (copied to `public/licenses/KayKit-CC0-License.txt`, 1718 bytes) |
| 2 | Characters | https://github.com/GeorgeQLe/assets-kaykit-3d-characters | 2080 | CC0-1.0 | same license file + manifest |
| 3 | Props | https://github.com/GeorgeQLe/assets-kaykit-3d-props | 7784 | CC0-1.0 | same license file + manifest |

Provenance: KayKit / Kay Lousberg, https://kaylousberg.itch.io/, "The Complete KayKit Collection v6". Credit appreciated, not required. Attribution recorded in `public/licenses/` and `asset-manifest.json`.

## File formats (measured, not assumed)

| Repo | glb | gltf+bin | fbx | obj+mtl | png | blend | other |
|---|---|---|---|---|---|---|---|
| Characters (2080) | **106** | 208/208 | 521 | 239/239 | 441 | 113 | 5 url |
| Environments (18363) | **0** | 2942/2942 | 5884 | 3176/3176 | 220 | 6 | 16 jpg, 1 pdf |
| Props (7784) | **3** | 1174/1174 | 2351 | 1251/1251 | 552 | 11 | 15 jpg, 1 txt, 1 url |

Implication: characters load directly as GLB in three.js/R3F. Environments and props ship as **glTF (.gltf) + .bin + textures**, loadable with three.js `GLTFLoader` as-is, or convertible offline to self-contained GLB. Build pipeline vendors only needed `.gltf + .bin (+ .png)` pairs, or pre-converts to `.glb`. No LFS pointers observed (manifest carries `sizeBytes`; spot-checked sizes are real file sizes).

## Selectable characters (verified real GLBs, Adventurers 2.0)

All under `assets/kaykit/adventurers-2.0/Characters/gltf/` in the characters repo:

| id | GLB path | bytes | Use |
|---|---|---|---|
| `knight` | `assets/kaykit/adventurers-2.0/Characters/gltf/Knight.glb` | 341688 | Selectable — "Knight of the Grove" |
| `mage` | `assets/kaykit/adventurers-2.0/Characters/gltf/Mage.glb` | 352472 | Selectable — "Moss Mage" |
| `rogue` | `assets/kaykit/adventurers-2.0/Characters/gltf/Rogue.glb` | 409188 | Selectable — "Thorn Rogue" |
| spare | `.../Rogue_Hooded.glb` | 381432 | reserve |
| spare | `.../Ranger.glb` | 484712 | reserve NPC |
| spare | `.../Druid.glb` | 465800 | reserve NPC |
| spare | `.../Barbarian.glb` | 386648 | reserve |
| spare | `.../Barbarian_Large.glb` | 686880 | reserve |
| spare | `.../Engineer.glb` | 455468 | reserve |

Animations (verified GLBs): `Animations/gltf/Rig_Medium/Rig_Medium_General.glb` (828240), `Rig_Medium_MovementBasic.glb` (689624), plus `Rig_Large` equivalents. Character GLBs carry their own rig; animation retargeting is attempted at runtime with graceful fallback to idle-bob if clips are incompatible. No combat stats — cosmetic only per spec.

No invented Knight/Mage/Rogue stats; names above are display labels tied to verified files.

## Environment packs (verified)

- `forest-nature-pack-1.0`: 9568 assets; **1588 glTF** e.g. `assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Bush_1_A_Color1.gltf`, `Grass_1_A_Color1.gltf`. Trees/rocks/grass/flowers/bridges/streams present in pack (full enumeration in upstream manifest).
- `dungeon-remastered-1.1`: 1753 assets; 283 glTF e.g. `assets/kaykit/dungeon-remastered-1.1/Assets/gltf/banner_blue.gltf` — used for Whispering Ruins columns/gate dressing.
- `medieval-hexagon-pack`, `city-builder-bits-1.0` (488), `platformer-pack`, `space-base-bits`: available for village buildings/props as needed.
- Vendoring strategy: download only selected `.gltf + .bin (+ texture)` triples via HTTPS raw, convert to GLB offline where beneficial, record each in `asset-manifest.json` with `verified: true`.

## Props (verified)

- 1174 glTF e.g. `assets/kaykit/block-bits-1.0/Assets/gltf/chest.gltf`, `barrel.gltf`, `anvil.gltf`, `apple.gltf`; fantasy weapons/RPG tools/resource bits packs cover staffs, potions, crystals, lanterns, runes.
- 3 native GLBs (prototype dummy) — not used for gameplay.

## Gaps / blockers (honest)

1. **No native GLB for environments/props** — not a blocker (glTF+bin loads identically in three.js), but build must vendor `.bin` siblings or pre-convert. Handled by vendor script.
2. **No verified KayKit fauna in these three repos** — wildlife uses restrained shader/particle spirit + ambient butterflies/fireflies (procedural points), not fake animal models; documented as gap, no unlicensed downloads.
3. **No audio in these repos** — audio uses Web Audio synthesized ambience (no external files), documented in KNOWN_LIMITATIONS.
4. Company network: only ordinary GitHub HTTPS used; no scripts executed from repos; sparse/selective download only.

## Selected files for vertical slice (to vendor)

Characters (GLB, direct): `Knight.glb`, `Mage.glb`, `Rogue.glb` + `Rig_Medium_MovementBasic.glb` (anim reference).
Environment (glTF+bin, forest pack, Color1): representative trees/bushes/grass/flowers/bridge/fountain set enumerated at build time by vendor script (exact filenames recorded into `asset-manifest.json` by the script run).
Props (glTF+bin): chest, barrel, lantern/crystal equivalents enumerated by vendor script.
License: `LICENSES/KayKit-CC0-License.txt` → `public/licenses/KayKit-CC0-License.txt` (done).
