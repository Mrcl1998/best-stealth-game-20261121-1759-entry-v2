// BLACKTIDE — world: the hand-crafted dockyard floor.
// Three zones left to right: container rows (A), crane yard (B), customs
// vault (C). Walls block movement AND sight; crates block sight only in the
// sense that they are low cover — here they block sight but Mara can slip
// around them, so they are stored separately from solid walls.
import { CFG } from './config.js';

// Solid rectangles {x, y, w, h}. Containers are rust red, teal or ochre.
export function buildWalls() {
  return [
    // Zone A — container rows.
    { x: 120, y: 170, w: 140, h: 42, color: '#8a3b2e', label: 'A1' },
    { x: 120, y: 300, w: 140, h: 42, color: '#2e6f6a', label: 'A2' },
    { x: 300, y: 420, w: 150, h: 42, color: '#a67c2e', label: 'A3' },
    { x: 80, y: 520, w: 120, h: 42, color: '#8a3b2e', label: 'A4' },
    { x: 300, y: 210, w: 110, h: 42, color: '#2e6f6a', label: 'A5' },
    // Yard office hut: two wall stubs leave a doorway facing the yard.
    { x: 250, y: 40, w: 160, h: 18, color: '#3d4a5c', label: 'office' },
    { x: 250, y: 40, w: 18, h: 90, color: '#3d4a5c', label: 'office' },
    // Zone B — crane yard.
    { x: 500, y: 300, w: 150, h: 42, color: '#8a3b2e', label: 'B1' },
    { x: 500, y: 520, w: 140, h: 42, color: '#2e6f6a', label: 'B2' },
    { x: 700, y: 420, w: 140, h: 42, color: '#a67c2e', label: 'B3' },
    { x: 560, y: 130, w: 120, h: 42, color: '#2e6f6a', label: 'B4' },
    // Zone C — customs vault.
    { x: 900, y: 210, w: 140, h: 42, color: '#8a3b2e', label: 'C1' },
    { x: 900, y: 430, w: 160, h: 42, color: '#2e6f6a', label: 'C2' },
    { x: 1060, y: 330, w: 110, h: 42, color: '#a67c2e', label: 'C3' },
    // Vault back wall and gate posts frame the exit.
    { x: 1120, y: 90, w: 100, h: 42, color: '#3d4a5c', label: 'vault' },
    { x: 1224, y: 270, w: 18, h: 60, color: '#1f7a4d', label: 'gate' },
    { x: 1224, y: 420, w: 18, h: 60, color: '#1f7a4d', label: 'gate' },
  ];
}

// Low crates: block sight, do not block movement (Mara slips around them).
export function buildCrates() {
  return [
    { x: 200, y: 90, w: 46, h: 46 },
    { x: 60, y: 380, w: 46, h: 46 },
    { x: 380, y: 250, w: 46, h: 46 },
    { x: 620, y: 250, w: 46, h: 46 },
    { x: 760, y: 560, w: 46, h: 46 },
    { x: 980, y: 90, w: 46, h: 46 },
    { x: 1120, y: 520, w: 46, h: 46 },
  ];
}

// Warm floodlight pools (risky to stand in) and dark shadow pockets (safe).
export function buildLights() {
  return [
    { x: 190, y: 120, r: 95 },
    { x: 360, y: 620, r: 90 },
    { x: 620, y: 200, r: 100 },
    { x: 780, y: 480, r: 90 },
    { x: 1010, y: 300, r: 95 },
    { x: 1180, y: 620, r: 85 },
  ];
}
export function buildShadows() {
  return [
    { x: 190, y: 250, r: 70 },
    { x: 370, y: 500, r: 75 },
    { x: 560, y: 400, r: 70 },
    { x: 760, y: 180, r: 70 },
    { x: 960, y: 540, r: 75 },
    { x: 1150, y: 180, r: 65 },
  ];
}

// Rain puddles that glint on the wet asphalt.
export function buildPuddles() {
  return [
    { x: 90, y: 220, rx: 55, ry: 16 },
    { x: 330, y: 90, rx: 48, ry: 14 },
    { x: 470, y: 640, rx: 60, ry: 16 },
    { x: 680, y: 90, rx: 52, ry: 15 },
    { x: 830, y: 330, rx: 58, ry: 16 },
    { x: 1000, y: 640, rx: 55, ry: 15 },
    { x: 1190, y: 120, rx: 48, ry: 14 },
  ];
}

// The three manifests, the two bonus loot crates and the harbour gate.
export function buildObjectives() {
  return {
    manifests: [
      { id: 0, x: 330, y: 95, name: 'Yard Office manifest', taken: false },
      { id: 1, x: 640, y: 235, name: 'Crane Hook manifest', taken: false },
      { id: 2, x: 1085, y: 155, name: 'Customs Vault manifest', taken: false },
    ],
    loot: [
      { id: 0, x: 200, y: 500, name: 'Smuggled silk', taken: false },
      { id: 1, x: 950, y: 555, name: 'Sealed crate', taken: false },
    ],
    exit: { x: 1245, y: 375, w: 30, h: 150 },
    start: { x: 60, y: 640 },
  };
}

// Patrol waypoints: open corridors, never inside a wall.
export function buildPatrols() {
  return [
    [{ x: 60, y: 100 }, { x: 400, y: 100 }],
    [{ x: 60, y: 600 }, { x: 400, y: 600 }],
    [{ x: 470, y: 120 }, { x: 830, y: 120 }],
    [{ x: 470, y: 620 }, { x: 830, y: 620 }],
    [{ x: 900, y: 280 }, { x: 1180, y: 280 }],
  ];
}

export function buildWorld() {
  return {
    w: CFG.W, h: CFG.H,
    walls: buildWalls(),
    crates: buildCrates(),
    lights: buildLights(),
    shadows: buildShadows(),
    puddles: buildPuddles(),
    ...buildObjectives(),
    patrols: buildPatrols(),
  };
}

