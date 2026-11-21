// BLACKTIDE — main: game loop, state machine, wiring.
// Screens: title -> play -> pause / caught / win. The loop runs on
// requestAnimationFrame with a clamped delta so a tab switch cannot
// teleport a guard across the yard. Every frame: input -> player -> guards
// -> devices -> suspicion -> alarm -> caught -> render -> sound cues.
import { CFG } from './config.js';
import { buildWorld } from './world.js';
import { makeGuards, updateGuard } from './guards.js';
import { updateSuspicion } from './vision.js';
import { makeSearchlight, makeCameras, updateSearchlight, updateCameras, watchSearchlight, watchCameras } from './searchlight.js';
import { makeNoise, updateNoise, throwBottle, runNoise } from './distract.js';
import { makePlayer, movePlayer, interact, checkCaught } from './player.js';
import { makeInput, attachInput, moveVector, wasPressed } from './input.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { playStep, playPickup, playClink, playSusTick, playAlarm, playWin, playCaught, startRain, setMuted, isMuted } from './audio.js';

export function makeState() {
  const world = buildWorld();
  return {
    world,
    player: makePlayer(world),
    guards: makeGuards(world),
    tower: makeSearchlight(),
    cameras: makeCameras(),
    noise: makeNoise(),
    rain: Array.from({ length: 130 }, (_, i) => ({
      x: (i * 97.3) % CFG.W, y: (i * 61.7) % CFG.H, v: 420 + (i % 5) * 60,
    })),
    screen: 'title',
    time: 0,
    score: 0,
    alarms: 0,
    alarm: 0,
    lastSeen: null,
    toast: '', toastT: 0,
    muted: false,
    winTime: 0,
    caughtBy: '',
    stepped: false,
    ranStep: false,
    susTickT: 0,
  };
}

export function resetState(state) {
  const fresh = makeState();
  fresh.screen = 'play';
  fresh.muted = state.muted;
  // fresh has no `input` key, so the attached input object survives.
  Object.assign(state, fresh);
}

function triggerAlarm(state, from) {
  if (state.alarm > 0) return;
  state.alarm = CFG.alarmSeconds;
  state.alarms += 1;
  state.lastSeen = { x: state.player.x, y: state.player.y };
  state.toast = `ALARM! Seen by ${from}`;
  state.toastT = 3;
  playAlarm();
}

function updatePlay(state, dt) {
  state.time += dt;
  if (state.toastT > 0) state.toastT -= dt;
  const input = state.input;
  const p = state.player;
  p.crouch = input.keys.has('crouch');
  p.running = input.keys.has('run') && !p.crouch;
  const mv = moveVector(input);
  movePlayer(state, mv.dx, mv.dy, dt);
  if (state.stepped) { playStep(p.running); state.stepped = false; }
  if (state.ranStep) { runNoise(state); state.ranStep = false; }
  if (wasPressed(input, 'bottle')) {
    const res = throwBottle(state);
    if (res) { playClink(); state.toast = `Bottle thrown — ${res.guard || 'no guard'} investigates`; state.toastT = 2; }
    else { state.toast = 'No bottles left'; state.toastT = 1.5; }
  }
  if (wasPressed(input, 'use')) {
    const res = interact(state);
    if (res === 'manifest' || res === 'loot') playPickup();
    if (res === 'win') playWin();
  }
  // Guards patrol / investigate / chase.
  for (const g of state.guards) updateGuard(g, dt, state.alarm > 0, state.lastSeen);
  updateSearchlight(state.tower, dt);
  updateCameras(state.cameras, dt);
  updateNoise(state.noise, dt);
  // Suspicion from every watcher; any 100 trips the alarm.
  let tripped = null;
  for (const g of state.guards) {
    if (updateSuspicion(g, state.world, p, dt)) tripped = tripped || g.name;
  }
  if (watchSearchlight(state.tower, state.world, p, dt)) tripped = tripped || 'the searchlight';
  if (watchCameras(state.cameras, state.world, p, dt)) tripped = tripped || 'a camera';
  if (tripped) triggerAlarm(state, tripped);
  if (state.alarm > 0) {
    state.alarm -= dt;
    if (state.alarm <= 0) {
      state.alarm = 0;
      for (const g of state.guards) { g.state = 'patrol'; g.suspicion = Math.min(g.suspicion, 40); }
      state.tower.suspicion = 0;
      for (const c of state.cameras) c.suspicion = 0;
    }
  }
  // Suspicion tick sound, pitched by the highest watcher.
  state.susTickT += dt;
  const maxSus = Math.max(state.tower.suspicion, ...state.guards.map((g) => g.suspicion));
  if (maxSus > 30 && state.susTickT > 0.5) { state.susTickT = 0; playSusTick(maxSus); }
  const wasCaught = checkCaught(state);
  if (wasCaught) playCaught();
}

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const state = makeState();
  state.input = makeInput();
  attachInput(state.input, canvas);
  // Test + screenshot hooks: deterministic poses and live state inspection.
  window.__BT = {
    state,
    start: () => { state.screen = 'play'; },
    reset: () => resetState(state),
    teleport: (x, y) => { state.player.x = x; state.player.y = y; },
    setScreen: (s) => { state.screen = s; },
    shot: (n) => applyShot(state, n),
  };
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  const seed = params.get('seed');
  if (shot) {
    applyShot(state, Number(shot));
  } else if (seed) {
    // Deterministic rain for screenshots: fixed drops, no randomness.
    state.rain.forEach((d, i) => { d.x = (i * 97.3) % CFG.W; d.y = (i * 61.7) % CFG.H; });
  }
  let last = performance.now();
  let t = 0;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    t += dt;
    const input = state.input;
    if (wasPressed(input, 'mute')) {
      state.muted = !state.muted;
      setMuted(state.muted);
    }
    if (wasPressed(input, 'restart') && state.screen !== 'title') resetState(state);
    if (state.screen === 'title') {
      if (wasPressed(input, 'enter') || input.mouse.clicked) {
        state.screen = 'play';
        input.mouse.clicked = false;
        startRain();
      }
      // Title ambience: tower sweeps, rain falls, guards patrol behind.
      updateSearchlight(state.tower, dt);
      updateCameras(state.cameras, dt);
      for (const g of state.guards) updateGuard(g, dt, false, null);
    } else if (state.screen === 'play') {
      if (wasPressed(input, 'pause')) { state.screen = 'pause'; }
      else updatePlay(state, dt);
    } else if (state.screen === 'pause') {
      if (wasPressed(input, 'pause') || wasPressed(input, 'enter')) state.screen = 'play';
    } else if (state.screen === 'caught' || state.screen === 'win') {
      if (wasPressed(input, 'restart')) resetState(state);
    }
    input.mouse.clicked = false;
    render(ctx, state, t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
