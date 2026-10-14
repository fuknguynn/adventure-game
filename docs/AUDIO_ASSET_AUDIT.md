# Eldergrove — Audio Asset Audit

**Date:** 2026-10-14 | **Auditor:** OpenCode agent | **Spec:** FANTASY_FOREST_MASTER_SPEC.md

All audio assets sourced from approved sources, converted to OGG (libvorbis, ~128kbps) via ffmpeg-static, and verified with ffprobe. No TypeScript/React code was modified. SFX are synthesized in code (no files).

## Sources

| # | Source | URL | License | Notes |
|---|---|---|---|---|
| 1 | Glorytales Music Collection | https://github.com/0xabad1dea/glorytales | CC-BY 4.0 | Composed by 0xabad1dea (Melissa Elliott). License verified from readme.md. Attribution required. |
| 2 | Freesound.org (CC0 previews) | https://freesound.org | CC0 (per-sound) | 30s preview MP3s from cdn.freesound.org. Each sound verified CC0 via search filter. |

## Music (7 files, 40s each, total 4.36 MB — budget 15 MB)

All music from Glorytales (CC-BY 4.0). Tracks trimmed to 40s with a 5s crossfade for seamless looping.

| Region | File | Source Track | Source URL | License | Attribution | Duration | Size |
|---|---|---|---|---|---|---|---|
| village | /audio/music/village.ogg | 005-HistoricVillage-99BPM-loop.mp3 | https://github.com/0xabad1dea/glorytales/blob/master/tracks/005-HistoricVillage-99BPM-loop.mp3 | CC-BY 4.0 | 0xabad1dea (Melissa Elliott) | 40s | 716,025 B |
| spirit | /audio/music/spirit.ogg | 007-MagicalForest-85BPM-loop.mp3 | https://github.com/0xabad1dea/glorytales/blob/master/tracks/007-MagicalForest-85BPM-loop.mp3 | CC-BY 4.0 | 0xabad1dea (Melissa Elliott) | 40s | 704,777 B |
| ruins | /audio/music/ruins.ogg | 012-OminousOverworldDrone-0BPM-noloop.mp3 | https://github.com/0xabad1dea/glorytales/blob/master/tracks/012-OminousOverworldDrone-0BPM-noloop.mp3 | CC-BY 4.0 | 0xabad1dea (Melissa Elliott) | 40s | 525,360 B |
| lake | /audio/music/lake.ogg | 002-StartMenuScreen-80BPM-loop.mp3 | https://github.com/0xabad1dea/glorytales/blob/master/tracks/002-StartMenuScreen-80BPM-loop.mp3 | CC-BY 4.0 | 0xabad1dea (Melissa Elliott) | 40s | 688,417 B |
| grove | /audio/music/grove.ogg | 010-MoodyAndSad-96BPM-loop.mp3 | https://github.com/0xabad1dea/glorytales/blob/master/tracks/010-MoodyAndSad-96BPM-loop.mp3 | CC-BY 4.0 | 0xabad1dea (Melissa Elliott) | 40s | 619,098 B |
| tree | /audio/music/tree.ogg | 013-LongRoad-100BPM-loop.mp3 | https://github.com/0xabad1dea/glorytales/blob/master/tracks/013-LongRoad-100BPM-loop.mp3 | CC-BY 4.0 | 0xabad1dea (Melissa Elliott) | 40s | 663,532 B |
| ending | /audio/music/ending.ogg | 008-TheSkyClears-88BPM-loop.mp3 | https://github.com/0xabad1dea/glorytales/blob/master/tracks/008-TheSkyClears-88BPM-loop.mp3 | CC-BY 4.0 | 0xabad1dea (Melissa Elliott) | 40s | 657,364 B |

## Ambience (6 files, 30s each, total 2.24 MB — budget 8 MB)

All ambience from Freesound CC0 previews. Sources trimmed/looped to 30s.

| Region | File | Source Sound | Source URL | License | Attribution | Duration | Size |
|---|---|---|---|---|---|---|---|
| village | /audio/ambience/village.ogg | 637563 — forest boreal light wind breeze through leaves + close loud birds (kyles) | https://freesound.org/s/637563/ | CC0 | None required | 30s | 414,320 B |
| spirit | /audio/ambience/spirit.ogg | 677451 — magical whistle (sounagix) | https://freesound.org/s/677451/ | CC0 | None required | 30s | 321,747 B |
| ruins | /audio/ambience/ruins.ogg | 216135 — Barred owls, cow, wind, & fall field crickets (naturenutt) | https://freesound.org/s/216135/ | CC0 | None required | 30s | 477,709 B |
| lake | /audio/ambience/lake.ogg | 853672 — The sound of a babbling brook (hoshisato) | https://freesound.org/s/853672/ | CC0 | None required | 30s | 380,467 B |
| grove | /audio/ambience/grove.ogg | 243438 — Cicada summer (beansqueso31) | https://freesound.org/s/243438/ | CC0 | None required | 30s | 467,701 B |
| tree | /audio/ambience/tree.ogg | 814710 — Flute Chamber (beautiful winds deep reverb) (CVLTIV8R) | https://freesound.org/s/814710/ | CC0 | None required | 28s | 292,076 B |

## Size Budget

| Category | Total | Budget | Status |
|---|---|---|---|
| Music | 4.36 MB | 15 MB | PASS |
| Ambience | 2.24 MB | 8 MB | PASS |
| **Total** | **6.61 MB** | **23 MB** | **PASS** |

## Verification

- All 13 OGG files verified valid via ffprobe (format: ogg, codec: vorbis).
- Music: 40s each (within 30-60s spec), 105-143 kbps.
- Ambience: 28-30s each (within 20-40s spec), 82-127 kbps.
- Total size 6.61 MB (well under 23 MB combined budget).
- No TypeScript/React code modified. SFX synthesized in code (no files).

## Notes

- Glorytales tracks are 320kbps MP3 source; converted to 128kbps OGG Vorbis.
- Freesound previews are 16kbps MP3 (30s); converted to 128kbps OGG Vorbis. Quality is adequate for subtle ambience loops.
- Music tracks use a 5s crossfade at the loop point for seamless looping.
- Ambience sources were trimmed or looped to exactly 30s (tree is 28s — source was 28s, kept as-is).
- The cc0-public-domain-sounds repo (Silentnoob21) was inspected but contains primarily game SFX (impacts, UI, sci-fi), not curated nature ambience. Not used for ambience.
- rainforest-ambience (klmtseng) is a procedural generator (MIT) — not used; would require runtime dependencies.
