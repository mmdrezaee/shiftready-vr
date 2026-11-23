// Synthesized site audio (no sound files): positional engines, reversing alarm,
// ambience and UI cues, all through one THREE.AudioListener.
import * as THREE from 'three';

export const audio = {
  listener: null,
  ctx: null,
  on: true,
  engines: [],
  beeper: null,
  ready: false,
};

export function initAudio(camera) {
  if (audio.ready) return true;
  try {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    audio.listener = listener;
    audio.ctx = listener.context;
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    audio.ready = true;
    ambience();
    return true;
  } catch (e) {
    audio.ready = false;
    return false;
  }
}

export function setSound(on) {
  audio.on = on;
  if (audio.listener) audio.listener.setMasterVolume(on ? 1 : 0);
}

function noiseBuffer(seconds = 2) {
  const ctx = audio.ctx;
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// Diesel-like engine: two detuned low oscillators plus filtered noise rumble.
export function addEngine(obj, freq, vol, { ref = 6, rolloff = 1.1 } = {}) {
  if (!audio.ready) return null;
  const ctx = audio.ctx;
  const pa = new THREE.PositionalAudio(audio.listener);
  const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = freq;
  const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = freq * 0.503;
  const nz = ctx.createBufferSource(); nz.buffer = noiseBuffer(2); nz.loop = true;
  const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 160;
  const ng = ctx.createGain(); ng.gain.value = 0.8;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const g = ctx.createGain(); g.gain.value = vol;
  o1.connect(lp); o2.connect(lp); nz.connect(nf); nf.connect(ng); ng.connect(lp); lp.connect(g);
  o1.start(); o2.start(); nz.start();
  pa.setNodeSource(g);
  pa.setRefDistance(ref);
  pa.setRolloffFactor(rolloff);
  obj.add(pa);
  const e = { pa, o1, o2, g, base: freq, vol };
  audio.engines.push(e);
  return e;
}

export function setEngineLoad(e, load) {
  if (!e) return;
  const t = audio.ctx.currentTime;
  e.o1.frequency.setTargetAtTime(e.base * (1 + load * 0.6), t, 0.2);
  e.o2.frequency.setTargetAtTime(e.base * 0.503 * (1 + load * 0.6), t, 0.2);
  e.g.gain.setTargetAtTime(e.vol * (0.7 + load * 0.5), t, 0.2);
}

export function addBeeper(obj) {
  if (!audio.ready) return null;
  const ctx = audio.ctx;
  const pa = new THREE.PositionalAudio(audio.listener);
  const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 1150;
  const g = ctx.createGain(); g.gain.value = 0;
  o.connect(g); o.start();
  pa.setNodeSource(g);
  pa.setRefDistance(5);
  pa.setRolloffFactor(1.0);
  obj.add(pa);
  audio.beeper = { pa, g, on: false, phase: 0 };
  return audio.beeper;
}

export function updateBeeper(active, dt) {
  const b = audio.beeper;
  if (!b) return;
  if (!active) { b.g.gain.value = 0; b.phase = 0; return; }
  b.phase += dt;
  const on = (b.phase % 1.0) < 0.5;
  b.g.gain.value = on ? 0.18 : 0;
}

function ambience() {
  const ctx = audio.ctx;
  const out = audio.listener.getInput();
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(3); src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 450; bp.Q.value = 0.6;
  const g = ctx.createGain(); g.gain.value = 0.035;
  src.connect(bp); bp.connect(g); g.connect(out); src.start();
  // distant hammering and banging
  const knock = () => {
    if (!audio.ready) return;
    const n = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) burst(0.025 + Math.random() * 0.02, 1800 + Math.random() * 1500, i * 0.28);
    setTimeout(knock, 1800 + Math.random() * 3500);
  };
  setTimeout(knock, 2000);
}

function burst(vol, freq, delay = 0) {
  const ctx = audio.ctx;
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.2);
  const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = freq; hp.Q.value = 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  src.connect(hp); hp.connect(g); g.connect(audio.listener.getInput());
  src.start(t); src.stop(t + 0.2);
}

function tone(freq, start, dur, type = 'sine', vol = 0.15, endFreq = null) {
  const ctx = audio.ctx;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(audio.listener.getInput());
  o.start(t); o.stop(t + dur + 0.05);
}

export function cue(kind) {
  if (!audio.ready) return;
  if (kind === 'catch') { tone(660, 0, 0.18, 'sine', 0.18); tone(990, 0.12, 0.28, 'sine', 0.18); }
  else if (kind === 'miss') { tone(180, 0, 0.45, 'sawtooth', 0.12, 120); }
  else if (kind === 'false') { tone(300, 0, 0.18, 'square', 0.08); tone(240, 0.16, 0.2, 'square', 0.08); }
  else if (kind === 'radio') { tone(1400, 0, 0.06, 'square', 0.05, 2400); burst(0.04, 3000, 0.07); }
  else if (kind === 'convert') { tone(520, 0, 0.12, 'triangle', 0.1); tone(780, 0.1, 0.18, 'triangle', 0.1); }
  else if (kind === 'whoosh') { burst(0.1, 1200, 0); tone(420, 0, 0.3, 'sine', 0.05, 900); }
  else if (kind === 'tick') { tone(880, 0, 0.08, 'sine', 0.12); }
  else if (kind === 'cleared') { tone(523, 0, 0.18, 'sine', 0.16); tone(659, 0.15, 0.18, 'sine', 0.16); tone(784, 0.3, 0.18, 'sine', 0.16); tone(1047, 0.45, 0.4, 'sine', 0.16); }
  else if (kind === 'badge') { tone(784, 0, 0.15, 'sine', 0.15); tone(1047, 0.12, 0.15, 'sine', 0.15); tone(1319, 0.24, 0.3, 'sine', 0.15); }
}
