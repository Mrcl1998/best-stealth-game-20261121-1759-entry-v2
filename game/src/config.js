// BLACKTIDE — config: every tuning constant for the dockyard stealth game.
// One place for sizes, speeds, cone geometry and suspicion rates so the
// other modules stay small and the balance can be read at a glance.
export const CFG = {
  W: 1280,
  H: 720,
  // Player movement, pixels per second.
  walkSpeed: 150,
  runSpeed: 235,
  crouchSpeed: 82,
  playerRadius: 13,
  // Vision cones: range in px, half-angle in radians.
  guardRange: 185,
  guardHalfAngle: 0.46,
  cameraRange: 175,
  cameraHalfAngle: 0.42,
  lightRange: 330,
  lightHalfAngle: 0.30,
  // Suspicion: points per second while fully seen, before modifiers.
  susBase: 46,
  susDrain: 26,
  susLightMult: 1.65,
  susShadowMult: 0.45,
  susCrouchMult: 0.55,
  susRunMult: 1.35,
  // Alarm: how long guards converge on the last seen spot.
  alarmSeconds: 8,
  catchRadius: 22,
  // Bottles: how many Mara carries, how far one flies, how long its ring lasts.
  bottlesStart: 3,
  bottleRange: 150,
  bottleRingSeconds: 2.2,
  investigateSeconds: 4.5,
  // Pickups: how close Mara must stand to grab something.
  pickupRadius: 34,
  exitRadius: 46,
  // Guard patrol: walk speed and how long a guard pauses at a waypoint.
  guardSpeed: 58,
  guardChaseSpeed: 118,
  guardPause: 1.4,
  cameraSweepSpeed: 0.55,
  lightSweepSpeed: 0.28,
};

// Colours for the five guards, chosen to read against the cold blue floor.
export const GUARD_COLORS = ['#f5a623', '#2ec4b6', '#e75480', '#a3e635', '#ff7a1a'];
// Names shown above each guard when suspicion is rising.
export const GUARD_NAMES = ['Rook', 'Vale', 'Iris', 'Pike', 'Sable'];
