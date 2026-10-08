# Character Animation Audit (2026-10-08)

Parsed actual GLB binaries — no assumptions.

## Selectable characters (public/models/characters/)

| Character | animations | SkinnedMesh | Skeleton joints | Rigged |
|---|---|---|---|---|
| Knight.glb | 0 | yes | 23 (`root,hips,spine,chest,head,upperarm…wrist…hand…handslot ×2,upperleg…foot,toes ×2`) | yes |
| Mage.glb | 0 | yes | same 23 names (different order) | yes |
| Rogue.glb | 0 | yes | same 23 names (different order) | yes |

Single root `root`; feet bind at y≈0; heights 2.18–2.65.

## Approved-repo animation sources (GeorgeQLe/assets-kaykit-3d-characters, CC0-1.0)

`adventurers-2.0/Animations/gltf/Rig_Medium/`:

| File | Clips relevant to locomotion |
|---|---|
| `Rig_Medium_General.glb` (828240b) | **Idle_A**, Idle_B, Interact, PickUp, plus Death/Hit/Spawn/T-Pose |
| `Rig_Medium_MovementBasic.glb` (689624b) | **Walking_A/B/C**, **Running_A/B**, **Jump_Idle/Start/Land/Full_Short/Full_Long**, T-Pose |

Clip targets use EXACTLY the same 23 bone names → name-based `AnimationMixer` binding works, no remapping.

## Root-motion analysis (decoded keyframe ranges)

| Clip | root.translation | hips.translation |
|---|---|---|
| Idle_A (1.07s) | all zeros | Y 0.384–0.392 (bob), X/Z 0 |
| Walking_A (1.07s) | all zeros | Y 0.325–0.380, X/Z 0 |
| Running_A (0.80s) | all zeros | Y 0.335–0.437, X/Z 0 |
| Jump_Start (0.60s) | all zeros | Y 0.274–0.506, X/Z 0 |
| Jump_Idle / Full_Short | all zeros | Y bob only, X/Z 0 |

**All clips are authored in place.** Nothing translates the character; Rapier stays authoritative with zero clip surgery.

## Decision (per priority order)

**Priority 2 — retarget existing KayKit clips.** Priority 1 impossible (no Adventurers character ships embedded clips — verified 0/3). Priorities 3–4 unnecessary: skeletons match exactly, same rig family, same repo, CC0.

## Risks

- Hips Y is absolute (~0.38); characters differ in height (±10%) → possible slight foot float/penetration per character. Mitigate visually; fallback is per-character hips-Y offset.
- No procedural bob as locomotion (per instruction); menu-stage bob stays (menu only, documented).
