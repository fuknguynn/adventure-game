/** Royalty-free-by-construction: all audio is synthesized with Web Audio. No external files. */
let ctx: AudioContext | null = null;
let ambientNodes: OscillatorNode[] = [];
let muted = false;
let musicVol = 0.5;
let sfxVol = 0.7;

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setAudioPrefs(o: { muted?: boolean; musicVolume?: number; sfxVolume?: number }) {
  if (o.muted !== undefined) muted = o.muted;
  if (o.musicVolume !== undefined) musicVol = o.musicVolume;
  if (o.sfxVolume !== undefined) sfxVol = o.sfxVolume;
  if (muted) stopAmbient();
}

/** Gentle detuned-pad forest ambience. Must be called after user gesture. */
export function startAmbient(restored: boolean) {
  const ac = ensureCtx();
  if (!ac || muted || ambientNodes.length) return;
  const gain = ac.createGain();
  gain.gain.value = 0.05 * musicVol * (restored ? 1.4 : 1);
  gain.connect(ac.destination);
  const freqs = restored ? [174, 261.6, 349.2, 523.25] : [146.8, 220, 293.7, 440];
  ambientNodes = freqs.map((f, i) => {
    const o = ac.createOscillator();
    o.type = i % 2 ? 'triangle' : 'sine';
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 4;
    o.connect(gain);
    o.start();
    return o;
  });
}

export function stopAmbient() {
  ambientNodes.forEach((o) => { try { o.stop(); } catch { /* noop */ } });
  ambientNodes = [];
}

function blip(freq: number, dur = 0.12, type: OscillatorType = 'sine') {
  const ac = ensureCtx();
  if (!ac || muted) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = 0.12 * sfxVol;
  o.connect(g); g.connect(ac.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.stop(ac.currentTime + dur + 0.02);
}

export const sfx = {
  interact: () => blip(660, 0.1),
  success: () => { blip(523.25, 0.12); setTimeout(() => blip(783.99, 0.18), 110); },
  error: () => blip(196, 0.18, 'square'),
  step: () => blip(220 + Math.random() * 40, 0.05),
  fragment: () => { blip(880, 0.15); setTimeout(() => blip(1174.66, 0.25), 140); },
};
