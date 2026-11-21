// BLACKTIDE — bottle distraction: throw, clink, noise ring, investigate.
// Mara carries 3 bottles. Q throws one toward her facing direction; it
// lands, rings, and the nearest guard walks over to look. Running also
// makes noise: a smaller ring that nearby guards notice.
import { CFG } from './config.js';
import { sendInvestigate } from './guards.js';

export function makeNoise() {
  return { rings: [] }; // {x, y, r, maxR, t, ttl, kind}
}

export function addRing(noise, x, y, kind) {
  const maxR = kind === 'bottle' ? 110 : 70;
  noise.rings.push({ x, y, r: 8, maxR, t: 0, ttl: CFG.bottleRingSeconds, kind });
}

export function updateNoise(noise, dt) {
  for (const r of noise.rings) {
    r.t += dt;
    r.r = 8 + (r.maxR - 8) * Math.min(1, r.t / r.ttl);
  }
  noise.rings = noise.rings.filter((r) => r.t < r.ttl);
}

// Throw a bottle from the player toward facing; returns the landing spot
// or null when Mara is out of bottles.
export function throwBottle(state) {
  const p = state.player;
  if (p.bottles <= 0) return null;
  p.bottles -= 1;
  const lx = p.x + Math.cos(p.angle) * CFG.bottleRange;
  const ly = p.y + Math.sin(p.angle) * CFG.bottleRange;
  const land = {
    x: Math.max(20, Math.min(CFG.W - 20, lx)),
    y: Math.max(20, Math.min(CFG.H - 20, ly)),
  };
  addRing(state.noise, land.x, land.y, 'bottle');
  const g = sendInvestigate(state.guards, land.x, land.y);
  return { land, guard: g ? g.name : null };
}

// Running is loud: every step leaves a ring a nearby guard will check.
export function runNoise(state) {
  const p = state.player;
  addRing(state.noise, p.x, p.y, 'run');
  for (const g of state.guards) {
    if (g.state !== 'patrol') continue;
    if (Math.hypot(g.x - p.x, g.y - p.y) < 130) {
      g.state = 'investigate';
      g.stateT = 0;
      g.target = { x: p.x, y: p.y };
    }
  }
}

