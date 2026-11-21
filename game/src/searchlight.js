// BLACKTIDE — searchlight tower + security cameras.
// The tower in the crane yard sweeps a wide bright white cone slowly; the
// two wall cameras in the customs vault sweep narrower cones back and forth.
// Both raise suspicion fast when they catch Mara — the tower fastest of all.
import { CFG } from './config.js';
import { inCone, lightLevel } from './vision.js';

export function makeSearchlight() {
  return {
    x: 640, y: 360,           // tower base, centre of the crane yard
    angle: -Math.PI / 2,      // starts pointing up
    sweep: 0,                 // sweep phase
    suspicion: 0,             // shared tower suspicion, shown in the HUD bar
  };
}

export function makeCameras() {
  return [
    { x: 960, y: 70, base: Math.PI / 2, angle: Math.PI / 2, phase: 0, suspicion: 0, blink: 0 },
    { x: 1160, y: 70, base: Math.PI / 2, angle: Math.PI / 2, phase: 1.6, suspicion: 0, blink: 0 },
  ];
}

export function updateSearchlight(tower, dt) {
  tower.sweep += dt * CFG.lightSweepSpeed;
  tower.angle = -Math.PI / 2 + Math.sin(tower.sweep) * 1.15;
}

export function updateCameras(cameras, dt) {
  for (const c of cameras) {
    c.phase += dt * CFG.cameraSweepSpeed;
    c.angle = c.base + Math.sin(c.phase) * 0.85;
    c.blink += dt;
  }
}

// Shared helper: a device (tower/camera) watches the player; returns true
// when its suspicion just hit 100. Rate is a multiple of the guard base.
function watchDevice(dev, world, player, dt, range, halfAngle, mult) {
  const seen = inCone(dev.x, dev.y, dev.angle, range, halfAngle, player.x, player.y, world);
  if (seen) {
    let rate = CFG.susBase * mult * lightLevel(world, player.x, player.y);
    if (player.crouch) rate *= CFG.susCrouchMult;
    dev.suspicion = Math.min(100, dev.suspicion + rate * dt);
    if (dev.suspicion >= 100) return true;
  } else {
    dev.suspicion = Math.max(0, dev.suspicion - CFG.susDrain * dt);
  }
  return false;
}

export function watchSearchlight(tower, world, player, dt) {
  return watchDevice(tower, world, player, dt, CFG.lightRange, CFG.lightHalfAngle, 1.5);
}

export function watchCameras(cameras, world, player, dt) {
  let tripped = false;
  for (const c of cameras) {
    if (watchDevice(c, world, player, dt, CFG.cameraRange, CFG.cameraHalfAngle, 1.2)) tripped = true;
  }
  return tripped;
}

// Highest suspicion across every watcher — the HUD's single suspicion bar.
export function maxSuspicion(guards, tower, cameras) {
  let m = tower.suspicion;
  for (const g of guards) m = Math.max(m, g.suspicion);
  for (const c of cameras) m = Math.max(m, c.suspicion);
  return m;
}

