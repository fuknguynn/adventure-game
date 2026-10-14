# Audio Implementation

Bus-based Web Audio system for Eldergrove. All audio is synthesized by default
(no external files required); region music/ambience files are loaded lazily
from `/audio/` when present and fall back to synthesized loops otherwise.

## Architecture

Single `AudioContext` (created lazily on the first user gesture) feeding a
master gain, which fans out to four buses:

```
master (GainNode) ──► destination
  ├─ music    (GainNode)  ← region music loops
  ├─ ambience (GainNode)  ← region ambience loops + positional sources
  ├─ sfx      (GainNode)  ← one-shot game SFX (synthesized)
  └─ ui       (GainNode)  ← UI blips
```

- **Master** gain is the single mute point. `muted` → master gain 0.
- **Music** bus gain = `settings.musicVolume`.
- **SFX** bus gain = `settings.sfxVolume`.
- **Ambience** and **UI** buses use fixed internal levels (0.5 / 0.4).

All nodes live in `src/systems/AudioSystem.ts`. There is exactly one
`AudioContext` for the app lifetime; it is never recreated.

## Lifecycle

| Event | Action |
|---|---|
| First user gesture (Continue / New / Enter) | `initAudio(region)` creates the context, resumes it if suspended, and starts region audio. |
| Settings change | `setAudioPrefs({muted, musicVolume, sfxVolume})` updates bus gains. Mute fades master to 0 over 50 ms; unmute restores. |
| Region change | `setRegion(region)` crossfades music + ambience (see below). |
| Exit to title | `stopAllAudio()` fades out all loops and removes positional sources. |
| Ending phase | `setRegion('ending')` crossfades to the ending track. |

`initAudio` is idempotent — safe to call from multiple gesture sites.

## Region transitions

`setRegion(region)` triggers a **3-second crossfade** for both music and
ambience:

1. Any loop not matching the new region is faded out over 3 s, then stopped
   and disconnected.
2. The new region's loop is started at gain 0 and faded in over 3 s.

During the crossfade at most 2 music + 2 ambience sources are active (old +
new). Buffers are lazy-loaded and cached; a synthesized fallback is used when
the `.ogg` file is missing, so the system always produces audio.

## Mute integration

`useSettings.muted` is the **single source of truth**. `setAudioPrefs` is the
only place mute is applied: it ramps the master gain to 0 (muted) or 1
(unmuted) over 50 ms. No second mute state exists. The SettingsView toggle
writes `useSettings.muted`, which flows through the existing
`setAudioPrefs` effect in `App.tsx`.

## Positional audio

Landmark sources use `PannerNode` with `panningModel = 'equalpower'` and
`distanceModel = 'inverse'` (refDistance 4, maxDistance 40, rolloff 1.2).
At most **4** positional sources are active at once.

| Source | Position | Kind |
|---|---|---|
| Spirit shrine | (2, 1.5, 2) | shrine |
| Ancient tree | (0, 3, 34) | tree |
| Lake water | (-29, 0.5, 6) | lake |
| Ruins stone | (31, 1, 5) | ruins |

`AudioDirector` (in `GameCanvas.tsx`) runs per frame: it updates the listener
position/orientation from the camera, detects the current region, and adds/
removes positional sources as the player enters/leaves each landmark's
radius.

## Asset loading

- Region music: `/audio/music/<region>.ogg`
- Region ambience: `/audio/ambience/<region>.ogg`

Buffers are fetched + decoded on first region entry and cached in a
`Map<string, AudioBuffer>`. Concurrent loads are deduped via a pending map.
If a file is missing or fails to decode, a synthesized loop (pad or filtered
noise, region-tuned) is generated and cached instead.

## Browser autoplay

The `AudioContext` is only created inside `initAudio`, which is called from
user-gesture handlers (Continue / New Adventure / Enter). If the context is
`suspended` on creation, `initAudio` calls `resume()`. No audio is started
before a gesture, so no autoplay errors occur.
