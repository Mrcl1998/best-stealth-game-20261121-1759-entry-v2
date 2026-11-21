// BLACKTIDE — shots: scripted deterministic poses for the 4 screenshots.
// Each pose sets the full visible state — player, guards, suspicion, alarm,
// pickups, noise rings — so a render of ?shot=N is the same every run.
// Shot 1: wide mid-yard cover view. Shot 2: close near-miss with a bottle
// already thrown. Shot 3: full alarm. Shot 4: the win at the harbour gate.
// (No imports needed here: poses write state fields directly.)

function setGuard(state, i, x, y, angle, suspicion, gstate) {
  const g = state.guards[i];
  g.x = x; g.y = y; g.angle = angle; g.suspicion = suspicion;
  g.state = gstate || 'patrol'; g.pause = 0;
}

export function applyShot(state, n) {
  state.screen = 'play';
  state.time = 0;
  // A fixed rain field so screenshots are byte-stable in layout.
  state.rain.forEach((d, i) => { d.x = (i * 97.3) % 1280; d.y = (i * 61.7) % 720; });
  if (n === 1) {
    // Cover: Mara crouched between containers, cones sweeping, beam crossing,
    // gate glowing at the right, a manifest visible.
    state.time = 47;
    state.player.x = 210; state.player.y = 255; state.player.crouch = true;
    state.player.angle = 0.4; state.player.bottles = 3;
    setGuard(state, 0, 150, 120, 0.5, 12);
    setGuard(state, 1, 330, 620, -1.2, 8);
    setGuard(state, 2, 560, 120, 0.9, 5);
    setGuard(state, 3, 760, 620, -0.6, 0);
    setGuard(state, 4, 1000, 280, 2.6, 18);
    state.tower.angle = 0.6;
    state.cameras[0].angle = 1.2; state.cameras[1].angle = 2.0;
    state.toast = 'Retrieve the manifests, reach the harbour gate unseen';
    state.toastT = 99;
  } else if (n === 2) {
    // Sneak: Mara crouched behind a container, orange cone inches away,
    // "?" above the guard, Bottles 2, noise ring visible where it landed.
    state.time = 96;
    state.player.x = 285; state.player.y = 385; state.player.crouch = true;
    state.player.angle = 0; state.player.bottles = 2;
    setGuard(state, 0, 330, 340, 2.2, 55, 'investigate');
    state.guards[0].target = { x: 420, y: 380 };
    setGuard(state, 1, 120, 620, 0.2, 0);
    setGuard(state, 2, 620, 120, 1.4, 0);
    setGuard(state, 3, 700, 620, -1.0, 0);
    setGuard(state, 4, 1080, 280, 2.8, 0);
    state.tower.angle = -0.8;
    state.noise.rings.push({ x: 420, y: 380, r: 60, maxR: 110, t: 0.6, ttl: 2.2, kind: 'bottle' });
    state.toast = 'Bottle thrown — Rook investigates';
    state.toastT = 99;
  } else if (n === 3) {
    // Alarm: red cones, ALARM banner, guards converging, tower red,
    // Mara near a loot crate — the near-miss moment.
    state.time = 154;
    state.player.x = 940; state.player.y = 520; state.player.crouch = false;
    state.player.angle = -2.2; state.player.bottles = 1;
    state.alarm = 6; state.alarms = 1;
    state.lastSeen = { x: 940, y: 520 };
    // Guards start 350+ px away: they converge visibly but cannot reach
    // Mara before the screenshot is taken (~1.2 s at chase speed).
    setGuard(state, 0, 560, 480, 0.3, 100, 'chase');
    setGuard(state, 1, 560, 640, -0.4, 100, 'chase');
    setGuard(state, 2, 480, 260, 0.9, 88, 'chase');
    setGuard(state, 3, 700, 180, 0.5, 92, 'chase');
    setGuard(state, 4, 1180, 120, 2.4, 100, 'chase');
    state.tower.angle = 0.9; state.tower.suspicion = 100;
    state.cameras[0].suspicion = 80; state.cameras[1].suspicion = 60;
    state.toast = 'ALARM! Seen by a camera';
    state.toastT = 99;
  } else if (n === 4) {
    // Exit: Mara standing IN the glowing gate, 3/3 manifests, 2/2 loot,
    // cones sweeping away behind her, translucent win card on top.
    state.screen = 'win';
    state.time = 212; state.winTime = 212; state.alarms = 1; state.score = 2000;
    state.player.x = 1245; state.player.y = 375; state.player.crouch = false;
    state.player.angle = 0; state.player.bottles = 2;
    for (const m of state.world.manifests) m.taken = true;
    for (const l of state.world.loot) l.taken = true;
    setGuard(state, 0, 200, 120, 2.8, 0);
    setGuard(state, 1, 300, 620, 3.1, 0);
    setGuard(state, 2, 600, 120, -2.6, 0);
    setGuard(state, 3, 800, 620, -2.9, 0);
    setGuard(state, 4, 980, 280, 3.0, 0);
    state.tower.angle = -1.4;
    state.cameras[0].angle = 2.4; state.cameras[1].angle = 2.6;
  }
  return state;
}
