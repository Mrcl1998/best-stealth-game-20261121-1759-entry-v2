// BLACKTIDE — audio: everything synthesised in WebAudio, no audio files.
// Rain is filtered noise, footsteps are short filtered thumps, the pickup
// is a two-note chime, the bottle is a bright clink, the alarm is a sting,
// and the win is a small rising motif. All guarded: no AudioContext, no sound.
let ctx = null;
let muted = false;
let rainNodes = null;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function ac() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch { return null; }
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  const c = ac();
  if (!c || muted) return;
  try {
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch { /* sound is decoration, never fatal */ }
}

export function playStep(running) {
  const c = ac();
  if (!c || muted) return;
  try {
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    o.type = 'sine'; o.frequency.setValueAtTime(running ? 95 : 70, t);
    f.type = 'lowpass'; f.frequency.value = 300;
    g.gain.setValueAtTime(running ? 0.10 : 0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(f).connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.1);
  } catch { /* ignore */ }
}

export function playPickup() { tone(660, 0.14, 'sine', 0.16); tone(990, 0.22, 'sine', 0.14, 0.09); }
export function playClink() {
  tone(1900, 0.12, 'triangle', 0.12);
  tone(2500, 0.09, 'triangle', 0.08, 0.03);
  tone(1300, 0.16, 'triangle', 0.06, 0.06);
}
export function playSusTick(level) {
  // Rising pitch as suspicion climbs: the ear knows before the eye does.
  tone(300 + level * 4, 0.07, 'square', 0.045);
}
export function playAlarm() {
  tone(440, 0.5, 'sawtooth', 0.14, 0, 880);
  tone(440, 0.5, 'sawtooth', 0.12, 0.45, 880);
  tone(220, 0.7, 'sawtooth', 0.10, 0.9, 110);
}
export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'sine', 0.14, i * 0.14));
}
export function playCaught() { tone(180, 0.8, 'sawtooth', 0.14, 0, 60); }

// Looping rain: brown noise through a low-pass filter, very quiet.
export function startRain() {
  const c = ac();
  if (!c || muted || rainNodes) return;
  try {
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900;
    const g = c.createGain(); g.gain.value = 0.05;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
    rainNodes = { src, g };
    // A slow ambient hum under the rain.
    const o = c.createOscillator();
    o.type = 'sine'; o.frequency.value = 55;
    const og = c.createGain(); og.gain.value = 0.02;
    o.connect(og).connect(c.destination);
    o.start();
    rainNodes.hum = o;
  } catch { /* ignore */ }
}
export function stopRain() {
  try { if (rainNodes) { rainNodes.src.stop(); rainNodes.hum.stop(); } } catch { /* ignore */ }
  rainNodes = null;
}

