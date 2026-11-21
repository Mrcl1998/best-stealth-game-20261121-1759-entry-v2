// BLACKTIDE — player: Mara's movement, crouch, noise, collision, caught/win.
// WASD/arrows move; Shift runs (fast, loud); C crouches (slow, hard to see).
// Walls stop her with a circle-vs-rectangle push-out, done axis by axis so
// she slides along a container instead of sticking to it.
import { CFG } from './config.js';
import { atExit, canExit, tryPickup } from './loot.js';

export function makePlayer(world) {
  return {
    x: world.start.x, y: world.start.y,
    angle: -Math.PI / 2, // facing up the yard
    crouch: false,
    running: false,
    moving: false,
    bottles: CFG.bottlesStart,
    stepT: 0, // footstep timer, for sound + run-noise pacing
  };
}

function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - cx, y - cy) < r;
}

export function collides(world, x, y, r) {
  if (x < r || x > CFG.W - r || y < r || y > CFG.H - r) return true;
  return world.walls.some((w) => circleHitsRect(x, y, r, w));
}

// Move with axis-separated collision so sliding along walls works.
export function movePlayer(state, dx, dy, dt) {
  const p = state.player;
  const speed = p.crouch ? CFG.crouchSpeed : (p.running ? CFG.runSpeed : CFG.walkSpeed);
  const len = Math.hypot(dx, dy);
  if (len < 0.01) { p.moving = false; return; }
  p.moving = true;
  p.angle = Math.atan2(dy, dx);
  const nx = p.x + (dx / len) * speed * dt;
  const ny = p.y + (dy / len) * speed * dt;
  if (!collides(state.world, nx, p.y, CFG.playerRadius)) p.x = nx;
  if (!collides(state.world, p.x, ny, CFG.playerRadius)) p.y = ny;
  // Footsteps: running steps come faster and leave a noise ring.
  p.stepT += dt;
  const interval = p.running ? 0.28 : 0.42;
  if (p.stepT >= interval) {
    p.stepT = 0;
    state.stepped = true;
    if (p.running) state.ranStep = true;
  }
}

// E key: pick up a manifest/loot, or slip out the harbour gate.
export function interact(state) {
  if (atExit(state)) {
    if (canExit(state)) {
      state.screen = 'win';
      state.winTime = state.time;
      return 'win';
    }
    state.toast = `Need ${3 - state.world.manifests.filter((m) => m.taken).length} more manifest(s)`;
    state.toastT = 2;
    return 'locked';
  }
  return tryPickup(state);
}

// Caught when a guard touches Mara during the alarm (or at full suspicion).
export function checkCaught(state) {
  if (state.screen !== 'play') return false;
  for (const g of state.guards) {
    const d = Math.hypot(g.x - state.player.x, g.y - state.player.y);
    if (d < CFG.catchRadius && (state.alarm > 0 || g.suspicion >= 95)) {
      state.screen = 'caught';
      state.caughtBy = g.name;
      return true;
    }
  }
  return false;
}

