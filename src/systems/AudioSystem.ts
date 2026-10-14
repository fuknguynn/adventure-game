/**
 * Bus-based audio system for Eldergrove.
 *
 * Graph:
 *   master (GainNode) ──► destination
 *     ├─ music    (GainNode)  ← region music loops
 *     ├─ ambience (GainNode)  ← region ambience loops + positional sources
 *     ├─ sfx      (GainNode)  ← one-shot game SFX (synthesized)
 *     └─ ui       (GainNode)  ← UI blips
 *
 * - Single AudioContext, lazily created on the first user gesture (initAudio).
 * - Music/ambience: one looping AudioBufferSourceNode per region, crossfaded
 *   over ~3s on region change. Buffers are lazy-loaded + cached; a synthesized
 *   fallback is used when the file is missing.
 * - SFX: synthesized one-shots routed through the SFX bus.
 * - UI: short blips routed through the UI bus.
 * - Positional: PannerNode (equalpower) for landmark sources with distance
 *   attenuation. Max 4 concurrent.
 * - Mute: single source of truth = useSettings.muted. setAudioPrefs fades the
 *   master gain to 0 over 50ms when muted, restores when unmuted.
 */

export type RegionId = 'village' | 'spirit' | 'ruins' | 'lake' | 'grove' | 'tree' | 'ending';
export type Surface = 'dirt' | 'grass' | 'stone';

const CROSSFADE = 3.0; // seconds
const MUTE_FADE = 0.05; // seconds
const MAX_POSITIONAL = 4;

// ---- context + buses ----
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let ambienceBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let uiBus: GainNode | null = null;

let muted = false;
let musicVol = 0.5;
let sfxVol = 0.7;

function makeCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ac.destination);
    musicBus = ac.createGain();
    musicBus.gain.value = musicVol;
    musicBus.connect(master);
    ambienceBus = ac.createGain();
    ambienceBus.gain.value = 0.5;
    ambienceBus.connect(master);
    sfxBus = ac.createGain();
    sfxBus.gain.value = sfxVol;
    sfxBus.connect(master);
    uiBus = ac.createGain();
    uiBus.gain.value = 0.4;
    uiBus.connect(master);
    ctx = ac;
    return ac;
  } catch {
    return null;
  }
}

function getCtx(): AudioContext | null {
  return ctx; // never creates; only initAudio creates
}

// ---- buffer cache (lazy fetch + decode, deduped) ----
const bufferCache = new Map<string, AudioBuffer>();
const pendingLoads = new Map<string, Promise<AudioBuffer | null>>();

async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const ac = getCtx();
  if (!ac) return null;
  if (bufferCache.has(url)) return bufferCache.get(url)!;
  if (pendingLoads.has(url)) return pendingLoads.get(url)!;
  const p = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const ab = await res.arrayBuffer();
      return await ac.decodeAudioData(ab);
    } catch {
      return null;
    }
  })();
  pendingLoads.set(url, p);
  const buf = await p;
  pendingLoads.delete(url);
  if (buf) bufferCache.set(url, buf);
  return buf;
}

// ---- synthesized fallbacks (loop-safe) ----
function synthPad(ac: AudioContext, freqs: number[], seconds = 8): AudioBuffer {
  const sr = ac.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ac.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const phase = i / len;
      let s = 0;
      for (let f = 0; f < freqs.length; f++) {
        const cycles = Math.max(1, Math.round(freqs[f] * seconds));
        s += Math.sin(2 * Math.PI * cycles * phase + (ch ? 0.4 : 0)) / freqs.length;
      }
      d[i] = s * 0.4;
    }
  }
  return buf;
}

function synthNoise(ac: AudioContext, seconds = 8, cutoff = 0.02): AudioBuffer {
  const sr = ac.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ac.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last += cutoff * (white - last);
    d[i] = last * 4;
  }
  // crossfade the loop boundary for a seamless loop
  const fade = Math.floor(sr * 0.15);
  for (let i = 0; i < fade; i++) {
    const a = i / fade;
    d[len - fade + i] = d[len - fade + i] * (1 - a) + d[i] * a;
  }
  return buf;
}

const MUSIC_FALLBACK: Record<string, number[]> = {
  village: [146.8, 220, 293.7, 440],
  spirit: [174.6, 261.6, 349.2, 523.3],
  ruins: [110, 164.8, 220, 329.6],
  lake: [130.8, 196, 261.6, 392],
  grove: [164.8, 246.9, 329.6, 493.9],
  tree: [146.8, 220, 349.2, 440],
  ending: [174.6, 261.6, 349.2, 523.3, 659.3],
};
const AMBIENCE_MODE: Record<string, 'pad' | 'noise'> = {
  village: 'noise', spirit: 'pad', ruins: 'noise', lake: 'noise', grove: 'pad', tree: 'pad', ending: 'pad',
};

async function getRegionBuffer(kind: 'music' | 'ambience', region: string): Promise<AudioBuffer | null> {
  const ac = getCtx();
  if (!ac) return null;
  const url = kind === 'music' ? `/audio/music/${region}.ogg` : `/audio/ambience/${region}.ogg`;
  const file = await loadBuffer(url);
  if (file) return file;
  const key = `${kind}:${region}`;
  const cached = bufferCache.get(key);
  if (cached) return cached;
  const freqs = MUSIC_FALLBACK[region] ?? MUSIC_FALLBACK.village;
  const buf = kind === 'music'
    ? synthPad(ac, freqs)
    : (AMBIENCE_MODE[region] ?? 'noise') === 'noise'
      ? synthNoise(ac, 8, region === 'lake' ? 0.04 : 0.015)
      : synthPad(ac, freqs.map((f) => f / 2), 8);
  bufferCache.set(key, buf);
  return buf;
}

// ---- looping source management (music + ambience) ----
interface Loop {
  region: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
  stopping: boolean;
}
const musicLoops: Loop[] = [];
const ambienceLoops: Loop[] = [];

function startLoop(kind: 'music' | 'ambience', region: string, buffer: AudioBuffer, fadeIn: number) {
  const ac = getCtx();
  if (!ac) return;
  const bus = kind === 'music' ? musicBus : ambienceBus;
  if (!bus) return;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ac.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(bus);
  source.start();
  const t = ac.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(1, t + fadeIn);
  const loop: Loop = { region, source, gain, stopping: false };
  (kind === 'music' ? musicLoops : ambienceLoops).push(loop);
}

function stopLoop(loop: Loop, fadeOut: number) {
  const ac = getCtx();
  if (!ac || loop.stopping) return;
  loop.stopping = true;
  const t = ac.currentTime;
  loop.gain.gain.cancelScheduledValues(t);
  loop.gain.gain.setValueAtTime(loop.gain.gain.value, t);
  loop.gain.gain.linearRampToValueAtTime(0, t + fadeOut);
  const remove = () => {
    try { loop.source.stop(); } catch { /* already stopped */ }
    try { loop.source.disconnect(); loop.gain.disconnect(); } catch { /* noop */ }
    const arr = musicLoops.includes(loop) ? musicLoops : ambienceLoops;
    const i = arr.indexOf(loop);
    if (i >= 0) arr.splice(i, 1);
  };
  setTimeout(remove, (fadeOut + 0.1) * 1000);
}

function crossfade(kind: 'music' | 'ambience', region: string) {
  const ac = getCtx();
  if (!ac) return;
  const arr = kind === 'music' ? musicLoops : ambienceLoops;
  // fade out any loop not for this region
  for (const loop of [...arr]) {
    if (loop.region !== region) stopLoop(loop, CROSSFADE);
  }
  // start new loop if not already playing (re-check after async load)
  if (!arr.some((l) => l.region === region && !l.stopping)) {
    void getRegionBuffer(kind, region).then((buf) => {
      if (buf && !arr.some((l) => l.region === region && !l.stopping)) {
        startLoop(kind, region, buf, CROSSFADE);
      }
    });
  }
}

// ---- synthesized one-shot SFX (routed through SFX bus) ----
function blip(freq: number, dur = 0.12, type: OscillatorType = 'sine', vol = 0.12, bus: GainNode | null = sfxBus) {
  const ac = getCtx();
  if (!ac || !bus) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(bus);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.stop(ac.currentTime + dur + 0.02);
}

function chime(freqs: number[], dur = 0.3, vol = 0.1) {
  const ac = getCtx();
  if (!ac || !sfxBus) return;
  const t = ac.currentTime;
  freqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.value = 0;
    o.connect(g);
    g.connect(sfxBus!);
    const start = t + i * 0.09;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.start(start);
    o.stop(start + dur + 0.02);
  });
}

function risingTone(from: number, to: number, dur = 0.6, vol = 0.1) {
  const ac = getCtx();
  if (!ac || !sfxBus) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  const t = ac.currentTime;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.value = vol;
  o.connect(g);
  g.connect(sfxBus);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
  o.stop(t + dur + 0.12);
}

// ---- surface-aware footsteps (synthesized, SFX bus) ----
const STEP_FREQ: Record<Surface, [number, number]> = {
  dirt: [180, 240],
  grass: [320, 420],
  stone: [520, 640],
};

function stepBlip(surface: Surface) {
  const ac = getCtx();
  if (!ac || !sfxBus) return;
  const [lo, hi] = STEP_FREQ[surface];
  const freq = lo + Math.random() * (hi - lo);
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = surface === 'stone' ? 'triangle' : 'sine';
  o.frequency.value = freq;
  g.gain.value = 0.07;
  o.connect(g);
  g.connect(sfxBus);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.06);
  o.stop(ac.currentTime + 0.08);
}

// ---- positional landmark sources (PannerNode, equalpower) ----
interface Positional {
  id: string;
  source: AudioBufferSourceNode;
  panner: PannerNode;
  gain: GainNode;
  pos: [number, number, number];
}
const positionals: Positional[] = [];

function makePositional(id: string, pos: [number, number, number], buffer: AudioBuffer, volume = 0.5): Positional | null {
  const ac = getCtx();
  if (!ac || !ambienceBus) return null;
  if (positionals.length >= MAX_POSITIONAL) return null;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const panner = ac.createPanner();
  panner.panningModel = 'equalpower';
  panner.distanceModel = 'inverse';
  panner.refDistance = 4;
  panner.maxDistance = 40;
  panner.rolloffFactor = 1.2;
  panner.positionX.value = pos[0];
  panner.positionY.value = pos[1];
  panner.positionZ.value = pos[2];
  const gain = ac.createGain();
  gain.gain.value = volume;
  source.connect(panner);
  panner.connect(gain);
  gain.connect(ambienceBus);
  source.start();
  const p: Positional = { id, source, panner, gain, pos };
  positionals.push(p);
  return p;
}

function removePositional(id: string) {
  const i = positionals.findIndex((p) => p.id === id);
  if (i < 0) return;
  const [p] = positionals.splice(i, 1);
  try { p.source.stop(); } catch { /* noop */ }
  try { p.source.disconnect(); p.panner.disconnect(); p.gain.disconnect(); } catch { /* noop */ }
}

/** Update listener position/orientation each frame. Call from GameCanvas useFrame. */
export function updateListener(pos: { x: number; y: number; z: number }, forward: { x: number; y: number; z: number }) {
  const ac = getCtx();
  if (!ac) return;
  const l = ac.listener;
  l.positionX.value = pos.x;
  l.positionY.value = pos.y;
  l.positionZ.value = pos.z;
  l.forwardX.value = forward.x;
  l.forwardY.value = forward.y;
  l.forwardZ.value = forward.z;
  l.upX.value = 0;
  l.upY.value = 1;
  l.upZ.value = 0;
}

/** Add a positional landmark source. Returns the id (for removal). */
export function addPositionalSource(id: string, pos: [number, number, number], kind: 'shrine' | 'tree' | 'lake' | 'ruins', volume = 0.5): string | null {
  const ac = getCtx();
  if (!ac) return null;
  if (positionals.some((p) => p.id === id)) return id;
  const freqs: Record<string, number[]> = {
    shrine: [523.3, 659.3, 784],
    tree: [146.8, 220, 293.7],
    lake: [110, 164.8, 220],
    ruins: [98, 146.8, 196],
  };
  const buf = synthPad(ac, freqs[kind] ?? freqs.shrine, 6);
  const p = makePositional(id, pos, buf, volume);
  return p ? id : null;
}

export function removePositionalSource(id: string) {
  removePositional(id);
}

// ---- region detection ----
const REGION_SPOTS: Record<string, [number, number]> = {
  spirit: [2, 2],
  ruins: [31, 5],
  lake: [-29, 6],
  grove: [28, -22],
  tree: [0, 34],
};
const REGION_RADIUS = 10;

/** Map a player (x,z) to a region id. 'ending' is set explicitly via setRegion. */
export function regionAt(x: number, z: number): RegionId {
  let best: RegionId = 'village';
  let bestD = Infinity;
  for (const [id, [sx, sz]] of Object.entries(REGION_SPOTS)) {
    const d = Math.hypot(x - sx, z - sz);
    if (d < bestD) { bestD = d; best = id as RegionId; }
  }
  return bestD <= REGION_RADIUS ? best : 'village';
}

let currentRegion: RegionId | null = null;

/** Trigger music + ambience crossfade to a new region. */
export function setRegion(region: RegionId) {
  if (region === currentRegion) return;
  currentRegion = region;
  crossfade('music', region);
  crossfade('ambience', region);
}

// ---- public API ----

/** Create the AudioContext (must be called from a user gesture) and start
 *  region audio for the given region. Safe to call repeatedly. */
export function initAudio(region: RegionId = 'village') {
  if (!ctx) makeCtx();
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  setRegion(region);
}

/** Apply settings. `muted` is the single source of truth for silence. */
export function setAudioPrefs(o: { muted?: boolean; musicVolume?: number; sfxVolume?: number }) {
  if (o.muted !== undefined) muted = o.muted;
  if (o.musicVolume !== undefined) musicVol = o.musicVolume;
  if (o.sfxVolume !== undefined) sfxVol = o.sfxVolume;
  const ac = getCtx();
  if (!ac || !master) return;
  const t = ac.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(muted ? 0 : 1, t + MUTE_FADE);
  if (musicBus) musicBus.gain.value = musicVol;
  if (sfxBus) sfxBus.gain.value = sfxVol;
}

/** Stop all loops + positional sources (e.g. on exit to title). */
export function stopAllAudio() {
  for (const l of [...musicLoops]) stopLoop(l, 0.3);
  for (const l of [...ambienceLoops]) stopLoop(l, 0.3);
  for (const p of [...positionals]) removePositional(p.id);
}

// ---- SFX object (existing names preserved, routed through SFX bus) ----
export const sfx = {
  interact: () => blip(660, 0.1),
  success: () => { blip(523.25, 0.12); setTimeout(() => blip(783.99, 0.18), 110); },
  error: () => blip(196, 0.18, 'square'),
  step: (surface: Surface = 'grass') => stepBlip(surface),
  fragment: () => { blip(880, 0.15); setTimeout(() => blip(1174.66, 0.25), 140); },
  // aliases
  puzzleSuccess: () => sfx.success(),
  puzzleFail: () => sfx.error(),
  fragmentCollected: () => sfx.fragment(),
  shrineInteract: () => chime([523.3, 659.3, 784], 0.4, 0.09),
  treeRestore: () => risingTone(146.8, 440, 0.8, 0.1),
  journalOpen: () => blip(440, 0.08, 'sine', 0.08, uiBus),
  mapOpen: () => blip(494, 0.08, 'sine', 0.08, uiBus),
  photoMode: () => blip(587, 0.08, 'sine', 0.08, uiBus),
};

// ---- UI blips (routed through UI bus) ----
export const ui = {
  hover: () => blip(880, 0.05, 'sine', 0.05, uiBus),
  click: () => blip(660, 0.07, 'sine', 0.08, uiBus),
};
