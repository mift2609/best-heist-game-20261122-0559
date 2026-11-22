// audio.js — procedural WebAudio sounds for the heist. No sound files:
// every effect is a small oscillator or noise burst built at run time.
// The context is created lazily on the first user gesture, so loading the
// page (or screenshotting it) never needs audio permission.

let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}
export function isMuted() {
  return muted;
}

function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, gain, lowpass = 1200) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  pickup() {
    tone(880, 0.09, 'sine', 0.12);
    tone(1318, 0.12, 'sine', 0.1, 0.06);
  },
  crackTick() {
    tone(2400, 0.03, 'square', 0.05);
  },
  vaultOpen() {
    tone(392, 0.12, 'triangle', 0.14);
    tone(523, 0.12, 'triangle', 0.14, 0.1);
    tone(784, 0.22, 'triangle', 0.16, 0.2);
    noiseBurst(0.25, 0.08, 900);
  },
  coin() {
    tone(1568, 0.07, 'sine', 0.1);
    tone(2093, 0.1, 'sine', 0.08, 0.05);
  },
  alert() {
    tone(220, 0.16, 'sawtooth', 0.12, 0, 440);
    tone(220, 0.16, 'sawtooth', 0.12, 0.18, 440);
  },
  busted() {
    tone(330, 0.25, 'sawtooth', 0.14, 0, 165);
    tone(165, 0.5, 'sawtooth', 0.14, 0.25, 82);
    noiseBurst(0.4, 0.1, 500);
  },
  clear() {
    tone(523, 0.12, 'triangle', 0.13);
    tone(659, 0.12, 'triangle', 0.13, 0.1);
    tone(784, 0.2, 'triangle', 0.15, 0.2);
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.11));
  },
};
