// BLACKTIDE — guards: patrol loops, waypoint pauses, investigate and chase.
// A guard is a small state machine: patrol -> investigate -> patrol, and
// patrol -> chase (alarm) -> patrol. Facing follows movement; at a waypoint
// the guard pauses and looks around, which is when a cone sweep is widest.
import { CFG, GUARD_COLORS, GUARD_NAMES } from './config.js';

export function makeGuards(world) {
  return world.patrols.map((pts, i) => ({
    id: i,
    name: GUARD_NAMES[i],
    color: GUARD_COLORS[i],
    x: pts[0].x, y: pts[0].y,
    waypoints: pts,
    wp: 1,
    dir: 1,
    angle: 0,
    pause: 0,
    lookT: 0,
    state: 'patrol', // patrol | investigate | chase
    stateT: 0,
    target: null,
    suspicion: 0,
    lastSeen: null,
    speed: CFG.guardSpeed,
  }));
}

// Move one guard toward (tx, ty) at speed, facing the movement direction.
function stepToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const s = Math.min(d, speed * dt);
  g.x += (dx / d) * s;
  g.y += (dy / d) * s;
  g.angle = Math.atan2(dy, dx);
  return d - s < 2;
}

export function updateGuard(g, dt, alarm, alarmTarget) {
  if (g.state === 'chase' || alarm) {
    // Alarm: converge on the last seen position, fast.
    g.state = 'chase';
    const t = alarmTarget || g.lastSeen || { x: g.x, y: g.y };
    if (stepToward(g, t.x, t.y, CFG.guardChaseSpeed, dt)) {
      // Reached the spot: look around for a moment, then resume patrol.
      g.stateT += dt;
      g.angle += dt * 1.6;
      if (g.stateT > 2.5) { g.state = 'patrol'; g.stateT = 0; }
    } else g.stateT = 0;
    return;
  }
  if (g.state === 'investigate') {
    g.stateT += dt;
    if (g.target && stepToward(g, g.target.x, g.target.y, CFG.guardSpeed * 1.25, dt)) {
      // Arrived: scan the spot, then give up and walk back to patrol.
      g.angle += dt * 2.2;
      if (g.stateT > CFG.investigateSeconds) {
        g.state = 'patrol'; g.stateT = 0; g.target = null;
      }
    }
    if (g.stateT > CFG.investigateSeconds + 3) {
      g.state = 'patrol'; g.stateT = 0; g.target = null;
    }
    return;
  }
  // Patrol: walk the loop, pausing and looking at each waypoint.
  if (g.pause > 0) {
    g.pause -= dt;
    g.lookT += dt;
    g.angle += Math.sin(g.lookT * 2.4) * dt * 1.1;
    if (g.pause <= 0) g.lookT = 0;
    return;
  }
  const wp = g.waypoints[g.wp];
  if (stepToward(g, wp.x, wp.y, g.speed, dt)) {
    g.pause = CFG.guardPause;
    g.wp = (g.wp + 1) % g.waypoints.length;
  }
}

// Send the nearest patrolling guard to a noise point to investigate it.
export function sendInvestigate(guards, x, y) {
  let best = null, bestD = Infinity;
  for (const g of guards) {
    if (g.state === 'chase') continue;
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestD) { bestD = d; best = g; }
  }
  if (!best) return null;
  best.state = 'investigate';
  best.stateT = 0;
  best.target = { x, y };
  best.pause = 0;
  return best;
}

// Cone colour by suspicion: yellow -> orange -> red.
export function coneColor(suspicion) {
  if (suspicion >= 70) return 'rgba(255,52,52,0.34)';
  if (suspicion >= 35) return 'rgba(255,150,40,0.30)';
  return 'rgba(255,220,90,0.24)';
}
export function suspicionMark(suspicion) {
  if (suspicion >= 70) return '!';
  if (suspicion >= 35) return '?';
  return '';
}

