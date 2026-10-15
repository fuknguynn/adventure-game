# Population Asset Audit

Audit of every imported NPC/animal model used by the Gameplay Depth Production Pass +
Population. Data sources: `docs/POPULATION_ASSET_INVENTORY.md` (source repos, packs,
licenses, triangle counts) and `src/regions/population.ts` (roles, regions, animation
clips/ranges, normalized world heights).

All assets are **CC0 1.0** — no attribution required.

## Imported models

| Model file | Source repo | Pack | Original filename | License | Intended role | Intended region | Animation clips/ranges | targetHeight (u) | Tri count |
|---|---|---|---|---|---|---|---|---|---|
| /models/characters/Medieval.gltf | agentkaerf/FreeModels | Ultimate Modular Women | Medieval.gltf | CC0 | Villager (talk) | village | clip: Idle | 2.2 | 7,276 |
| /models/characters/Farmer.gltf | agentkaerf/FreeModels | Ultimate Modular Men | Farmer.gltf | CC0 | Merchant (talk) | village | clip: Idle | 2.2 | 5,476 |
| /models/characters/Worker.gltf | agentkaerf/FreeModels | Ultimate Modular Men | Worker.gltf | CC0 | Vendor (talk) | market | clip: Idle | 2.2 | 5,240 |
| /models/characters/Adventurer.gltf | agentkaerf/FreeModels | Ultimate Modular Men | Adventurer.gltf | CC0 | Fisherman (talk) + Scholar (talk) | lake, ruins | clip: Idle | 2.2 | 10,202 |
| /models/characters/Worker_F.gltf | agentkaerf/FreeModels | Ultimate Modular Women | Worker.gltf | CC0 | (spare female laborer) | — | clip: Idle | — | 6,112 |
| /models/wildlife/Deer.gltf | agentkaerf/FreeModels | Ultimate Animated Animals | Deer.gltf | CC0 | Deer (wander) | grove, clearing | clip: Idle_Headlow / Idle | 1.5 | 2,098 |
| /models/wildlife/Stag.gltf | agentkaerf/FreeModels | Ultimate Animated Animals | Stag.gltf | CC0 | Stag | grove | clip: Idle | 1.8 | 3,670 |
| /models/wildlife/Fox.gltf | agentkaerf/FreeModels | Ultimate Animated Animals | Fox.gltf | CC0 | Fox (wander) | village, grove | clip: Idle | 0.6 | 1,848 |
| /models/wildlife/Duck.glb | Ariescar/gobkit-free-assets | animal | Duck.glb | CC0 | Duck (swim bob) | lake | baked range 0–1.2s | 0.3 | 508 |
| /models/wildlife/Bat.glb | Ariescar/gobkit-free-assets | animal | Bat.glb | CC0 | Bat (ambient flyer) | ruins | baked range 0–1.2s | 0.3 | 376 |

## Notes

- **Quaternius animals** (Deer, Stag, Fox): 1.8k–3.7k tris, 13 separate named clips each
  (`Idle`, `Idle_Headlow`, `Walk`, `Gallop`, `Eating`, …). Eldergrove uses the `Idle` /
  `Idle_Headlow` clips for ambient standing/grazing.
- **Quaternius men** (Farmer, Worker, Adventurer): 5.2k–11k tris, 23 separate clips each
  (`Idle`, `Walk`, `Run`, `Interact`, `Wave`, …). Eldergrove uses `Idle`.
- **Quaternius women** (Medieval, Worker_F): 5.9k–8k tris, same 23-clip set. Eldergrove
  uses `Idle`.
- **Gobkit animals** (Duck, Bat): 266–508 tris, one baked single-clip timeline (24 fps,
  30-frame segments: idle 0–29, attack 30–59, dead 60–89, walk 90–119). Eldergrove scrubs
  the baked range 0–1.2s (idle segment) via `mixer.setTime`.
- **Worker_F.gltf** is a spare female laborer (Women `Worker.gltf`) vendored for future
  population variety; not currently referenced by any `POPULATION` entry.
- **Adventurer.gltf** (Men) is reused for two entries: `fisherman` (lake) and `scholar`
  (ruins).
- Triangle counts are exact (parsed from geometry index accessors) per the inventory doc.
- `targetHeight` is the normalized world height the loader scales each model to
  (player reference = 2.54u).
