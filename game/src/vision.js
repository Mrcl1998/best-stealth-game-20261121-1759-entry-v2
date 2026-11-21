// BLACKTIDE — vision: cone geometry, line of sight, light level, suspicion.
// Detection needs all three: inside the cone angle, inside the range, and a
// clear line of sight past walls and crates. Light and posture then scale
// how fast suspicion climbs; suspicion drains when the player is unseen.
import { CFG } from './config.js';

// Does segment (x1,y1)-(x2,y2) cross rectangle r? Slab test on both axes.
function segHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const axes = [
    [dx, x1 - r.x, x1 - (r.x + r.w)],
    [dy, y1 - r.y, y1 - (r.y + r.h)],
  ];
  // Each axis gives the t-range where the segment is inside the slab.
  for (const [d, a, b] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (a < 0 || b > 0) return false;
    } else {
      let ta = -a / d, tb = -b / d;
      if (ta > tb) { const t = ta; ta = tb; tb = t; }
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      if (t0 > t1) return false;
    }
  }
  return true;
}

export function losClear(world, x1, y1, x2, y2) {
  for (const w of world.walls) if (segHitsRect(x1, y1, x2, y2, w)) return false;
  for (const c of world.crates) if (segHitsRect(x1, y1, x2, y2, c)) return false;
  return true;
}

// Smallest absolute angle between a and b, in [0, PI].
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Is the player inside this cone (origin, facing, range, half-angle)?
export function inCone(ox, oy, angle, range, halfAngle, px, py, world) {
  const dx = px - ox, dy = py - oy;
  const d = Math.hypot(dx, dy);
  if (d > range) return false;
  if (d > 4 && angleDiff(Math.atan2(dy, dx), angle) > halfAngle) return false;
  return losClear(world, ox, oy, px, py);
}

// Light level at a point: 1.6 in a floodlight pool, 0.45 in a shadow pocket.
export function lightLevel(world, x, y) {
  for (const s of world.shadows) {
    if (Math.hypot(x - s.x, y - s.y) < s.r) return CFG.susShadowMult;
  }
  for (const l of world.lights) {
    if (Math.hypot(x - l.x, y - l.y) < l.r) return CFG.susLightMult;
  }
  return 1;
}

export function inShadow(world, x, y) {
  return world.shadows.some((s) => Math.hypot(x - s.x, y - s.y) < s.r);
}
export function inLight(world, x, y) {
  return world.lights.some((l) => Math.hypot(x - l.x, y - l.y) < l.r);
}

// Update one guard's suspicion from whether it can see the player.
// Returns true when this guard's suspicion just hit 100 (alarm trigger).
export function updateSuspicion(g, world, player, dt, seenByLight) {
  const range = CFG.guardRange * (player.crouch ? 0.75 : 1);
  const seen = inCone(g.x, g.y, g.angle, range, CFG.guardHalfAngle, player.x, player.y, world);
  if (seen) {
    let rate = CFG.susBase * lightLevel(world, player.x, player.y);
    if (player.crouch) rate *= CFG.susCrouchMult;
    if (player.running) rate *= CFG.susRunMult;
    // Closer = faster: up to +60% at point blank.
    const d = Math.hypot(g.x - player.x, g.y - player.y);
    rate *= 1 + 0.6 * (1 - Math.min(1, d / range));
    g.suspicion = Math.min(100, g.suspicion + rate * dt);
    g.lastSeen = { x: player.x, y: player.y };
    if (g.suspicion >= 100) return true;
  } else {
    g.suspicion = Math.max(0, g.suspicion - CFG.susDrain * dt);
  }
  return false;
}

