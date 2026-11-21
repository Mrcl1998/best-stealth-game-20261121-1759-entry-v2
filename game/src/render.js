// BLACKTIDE — render: everything drawn on the canvas.
// Cold blue-teal rainy dockyard: wet asphalt, puddle glints, floodlight
// pools, shadow pockets, rust/teal/ochre containers, neon signs, rain
// streaks, and the signature translucent vision cones. HUD + screens too.
import { CFG } from './config.js';
import { coneColor, suspicionMark } from './guards.js';
import { maxSuspicion } from './searchlight.js';
import { manifestsGot, lootGot } from './loot.js';
import { inShadow } from './vision.js';

function drawCone(ctx, x, y, angle, range, half, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawRect(ctx, r, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); }
}

export function drawWorld(ctx, state, t) {
  const world = state.world;
  // Wet asphalt base with a subtle vertical gradient.
  const g = ctx.createLinearGradient(0, 0, 0, CFG.H);
  g.addColorStop(0, '#16283a');
  g.addColorStop(0.5, '#122033');
  g.addColorStop(1, '#0d1826');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  // Asphalt speckle, deterministic from a grid hash.
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 260; i++) {
    const x = (i * 137.5) % CFG.W, y = (i * 89.3) % CFG.H;
    ctx.fillRect(x, y, 3, 2);
  }
  // Zone labels painted on the floor, just under the HUD bar so nothing
  // overlaps them (the bottom HUD strip covers y 668-710).
  ctx.font = 'bold 26px monospace';
  ctx.fillStyle = 'rgba(120,200,220,0.16)';
  ctx.fillText('CONTAINER ROWS', 30, 78);
  ctx.fillText('CRANE YARD', 560, 78);
  ctx.fillText('CUSTOMS VAULT', 960, 78);
  // Puddles with moving glints.
  for (const p of world.puddles) {
    ctx.fillStyle = 'rgba(90,160,200,0.22)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200,240,255,0.35)';
    const gx = p.x - p.rx * 0.5 + ((t * 12 + p.x) % p.rx);
    ctx.fillRect(gx, p.y - 2, 14, 2);
  }
  // Shadow pockets: dark, safe.
  for (const s of world.shadows) {
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  // Floodlight pools: warm bright circles.
  for (const l of world.lights) {
    const rg = ctx.createRadialGradient(l.x, l.y, 6, l.x, l.y, l.r);
    rg.addColorStop(0, 'rgba(255,214,140,0.34)');
    rg.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawProps(ctx, state, t) {
  const world = state.world;
  // Containers: solid walls with ribbed tops and a label.
  for (const w of world.walls) {
    drawRect(ctx, w, w.color, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let x = w.x + 8; x < w.x + w.w - 6; x += 16) ctx.fillRect(x, w.y + 4, 3, w.h - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(w.label, w.x + 6, w.y + 15);
  }
  // Low crates.
  for (const c of world.crates) {
    drawRect(ctx, c, '#6b4f2a', '#3d2c17');
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h); ctx.stroke();
  }
  // Crane silhouette overhead in the crane yard.
  ctx.strokeStyle = 'rgba(10,20,32,0.9)';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(470, 0); ctx.lineTo(470, 90); ctx.lineTo(840, 90); ctx.lineTo(840, 0); ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(640, 90); ctx.lineTo(640, 150); ctx.stroke();
  ctx.fillStyle = '#d8b13c';
  ctx.fillRect(628, 148, 24, 18); // the hook block
  // Neon signs on the yard office and vault walls, clear of the HUD.
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#39d0ff';
  ctx.fillText('TERMINAL', 300, 140);
  ctx.fillStyle = '#ff5d8f';
  ctx.fillText('CUSTOMS', 1130, 200);
  // Harbour gate: glowing green at the far right.
  const e = world.exit;
  const pulse = 0.55 + 0.25 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(46,204,113,${pulse})`;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = '#a9f5c8';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#eafff2';
  ctx.font = 'bold 15px monospace';
  ctx.save();
  ctx.translate(e.x + 15, e.y + e.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('HARBOUR GATE', 0, 5);
  ctx.restore();
  ctx.textAlign = 'left';
  // Manifests: glowing gold folders.
  for (const m of world.manifests) {
    if (m.taken) continue;
    const bob = Math.sin(t * 3 + m.id) * 3;
    ctx.fillStyle = '#ffd94d';
    ctx.fillRect(m.x - 10, m.y - 8 + bob, 20, 14);
    ctx.fillStyle = '#7a5b00';
    ctx.fillRect(m.x - 10, m.y - 8 + bob, 20, 4);
    ctx.fillStyle = '#fff3b0';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('M', m.x - 3, m.y + 3 + bob);
    ctx.strokeStyle = 'rgba(255,217,77,0.8)';
    ctx.beginPath(); ctx.arc(m.x, m.y + bob, 18, 0, Math.PI * 2); ctx.stroke();
  }
  // Loot crates: teal chests.
  for (const l of world.loot) {
    if (l.taken) continue;
    ctx.fillStyle = '#2ec4b6';
    ctx.fillRect(l.x - 12, l.y - 10, 24, 18);
    ctx.fillStyle = '#0b3d39';
    ctx.fillRect(l.x - 12, l.y - 2, 24, 3);
    ctx.fillStyle = '#eafffb';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('$', l.x - 3, l.y + 6);
  }
}

export function drawActors(ctx, state, t) {
  // Searchlight beam first (under the actors, over the floor).
  const tower = state.tower;
  const beamColor = state.alarm > 0 ? 'rgba(255,70,70,0.30)' : 'rgba(255,255,230,0.28)';
  drawCone(ctx, tower.x, tower.y, tower.angle, CFG.lightRange, CFG.lightHalfAngle, beamColor);
  // Camera cones.
  for (const c of state.cameras) {
    drawCone(ctx, c.x, c.y, c.angle, CFG.cameraRange, CFG.cameraHalfAngle, 'rgba(255,90,90,0.22)');
  }
  // Guard cones, then the guards themselves.
  for (const g of state.guards) {
    drawCone(ctx, g.x, g.y, g.angle, CFG.guardRange, CFG.guardHalfAngle, coneColor(g.suspicion));
  }
  // Tower base.
  ctx.fillStyle = '#3d4a5c';
  ctx.fillRect(tower.x - 10, tower.y - 10, 20, 20);
  ctx.fillStyle = state.alarm > 0 ? '#ff4444' : '#fff8c0';
  ctx.beginPath(); ctx.arc(tower.x, tower.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9fb3c8';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('TOWER', tower.x - 18, tower.y + 26);
  // Cameras on the wall.
  for (const c of state.cameras) {
    ctx.fillStyle = '#222e3a';
    ctx.fillRect(c.x - 9, c.y - 6, 18, 12);
    const on = Math.floor(c.blink * 2) % 2 === 0;
    ctx.fillStyle = on ? '#ff2222' : '#661111';
    ctx.beginPath(); ctx.arc(c.x + 11, c.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Guards: coloured body, dark visor, facing tick, name + suspicion bar.
  for (const g of state.guards) {
    ctx.fillStyle = g.color;
    ctx.beginPath(); ctx.arc(g.x, g.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#101820';
    ctx.beginPath(); ctx.arc(g.x, g.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x + Math.cos(g.angle) * 10, g.y + Math.sin(g.angle) * 10);
    ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
    ctx.stroke();
    const mark = suspicionMark(g.suspicion);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = mark === '!' ? '#ff4444' : '#ffd94d';
    if (mark) ctx.fillText(mark, g.x - 5, g.y - 18);
    if (g.suspicion > 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(g.x - 16, g.y - 32, 32, 5);
      ctx.fillStyle = g.suspicion >= 70 ? '#ff4444' : '#ffb020';
      ctx.fillRect(g.x - 16, g.y - 32, 32 * (g.suspicion / 100), 5);
    }
    if (g.state === 'investigate') {
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('?', g.x + 14, g.y - 12);
    }
  }
  // Noise rings: expanding circles where a bottle landed or feet ran.
  for (const r of state.noise.rings) {
    ctx.strokeStyle = r.kind === 'bottle' ? 'rgba(255,217,77,0.9)' : 'rgba(160,220,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
  }
  // Mara: dark hooded figure, cyan scarf, white outline ring, facing tick.
  const p = state.player;
  const pr = p.crouch ? 10 : CFG.playerRadius;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, pr + 4, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#1b2430';
  ctx.beginPath(); ctx.arc(p.x, p.y, pr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22d3ee'; // cyan scarf
  ctx.beginPath(); ctx.arc(p.x, p.y, pr * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.angle) * pr * 0.5, p.y + Math.sin(p.angle) * pr * 0.5);
  ctx.lineTo(p.x + Math.cos(p.angle) * (pr + 9), p.y + Math.sin(p.angle) * (pr + 9));
  ctx.stroke();
  if (p.crouch) {
    ctx.fillStyle = '#cfe8ff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('crouched', p.x - 24, p.y - pr - 10);
  }
  if (inShadow(state.world, p.x, p.y)) {
    ctx.fillStyle = 'rgba(120,200,255,0.8)';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('hidden', p.x - 18, p.y + pr + 16);
  }
}

export function drawRain(ctx, state, t) {
  ctx.strokeStyle = 'rgba(180,220,255,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const d of state.rain) {
    const y = (d.y + t * d.v) % CFG.H;
    ctx.moveTo(d.x, y);
    ctx.lineTo(d.x - 3, y + 12);
  }
  ctx.stroke();
}

export function drawHUD(ctx, state) {
  const sus = maxSuspicion(state.guards, state.tower, state.cameras);
  // Top bar.
  ctx.fillStyle = 'rgba(5,12,20,0.72)';
  ctx.fillRect(0, 0, CFG.W, 46);
  ctx.fillStyle = '#eaf6ff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('BLACKTIDE', 14, 29);
  ctx.font = '14px monospace';
  ctx.fillText(`Manifests ${manifestsGot(state)}/3`, 180, 29);
  ctx.fillText(`Loot ${lootGot(state)}/2`, 320, 29);
  ctx.fillText(`Bottles ${state.player.bottles}`, 430, 29);
  ctx.fillText(`Score ${state.score}`, 540, 29);
  const mm = Math.floor(state.time / 60), ss = Math.floor(state.time % 60);
  ctx.fillText(`Time ${mm}:${String(ss).padStart(2, '0')}`, 660, 29);
  ctx.fillText(state.muted ? 'MUTED (M)' : 'Sound on (M)', 800, 29);
  // Suspicion bar.
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(960, 14, 200, 16);
  ctx.fillStyle = sus >= 70 ? '#ff4444' : sus >= 35 ? '#ff9a28' : '#ffd94d';
  ctx.fillRect(960, 14, 200 * (sus / 100), 16);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(960, 14, 200, 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.fillText('SUSPICION', 1168, 27);
  // Objective + controls, bottom left.
  ctx.fillStyle = 'rgba(5,12,20,0.6)';
  ctx.fillRect(10, CFG.H - 52, 640, 42);
  ctx.fillStyle = '#cfe8ff';
  ctx.font = '13px monospace';
  ctx.fillText('Retrieve the manifests, reach the harbour gate unseen', 20, CFG.H - 32);
  ctx.fillText('WASD move · Shift run · C crouch · Q bottle · E pick up · P pause · R restart', 20, CFG.H - 14);
  // Toast message.
  if (state.toastT > 0 && state.toast) {
    ctx.fillStyle = 'rgba(5,12,20,0.8)';
    const w = ctx.measureText(state.toast).width + 24;
    ctx.fillRect((CFG.W - w) / 2, 58, w, 30);
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(state.toast, (CFG.W - w) / 2 + 12, 79);
  }
  // Alarm banner.
  if (state.alarm > 0) {
    const blink = Math.floor(state.time * 4) % 2 === 0;
    ctx.fillStyle = blink ? 'rgba(200,20,20,0.9)' : 'rgba(120,10,10,0.9)';
    ctx.fillRect(0, 52, CFG.W, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`!! ALARM — guards converging (${Math.ceil(state.alarm)}s) !!`, CFG.W / 2, 77);
    ctx.textAlign = 'left';
  }
}

function panel(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = `rgba(6,14,24,${alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#39d0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

export function drawScreens(ctx, state, t) {
  if (state.screen === 'title') {
    // Animated rain + sweeping beam behind the title (world still draws).
    panel(ctx, 340, 150, 600, 380, 0.82);
    ctx.fillStyle = '#39d0ff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BLACKTIDE', CFG.W / 2, 250);
    ctx.fillStyle = '#eaf6ff';
    ctx.font = '20px monospace';
    ctx.fillText('A rainy dockyard stealth game', CFG.W / 2, 290);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#cfe8ff';
    ctx.fillText('You are Mara, a dock runner. Steal 3 cargo manifests', CFG.W / 2, 340);
    ctx.fillText('and slip out the harbour gate — unseen.', CFG.W / 2, 364);
    ctx.fillText('WASD move · Shift run (loud) · C crouch · Q throw bottle', CFG.W / 2, 404);
    ctx.fillText('E pick up / exit · P pause · R restart · M mute', CFG.W / 2, 428);
    const pulse = 0.6 + 0.4 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(255,217,77,${pulse})`;
    ctx.font = 'bold 22px monospace';
    ctx.fillText('Press Enter / click to start', CFG.W / 2, 486);
    ctx.textAlign = 'left';
  } else if (state.screen === 'pause') {
    panel(ctx, 440, 240, 400, 200, 0.85);
    ctx.fillStyle = '#eaf6ff';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CFG.W / 2, 320);
    ctx.font = '16px monospace';
    ctx.fillText('Press P to resume · R to restart', CFG.W / 2, 360);
    ctx.textAlign = 'left';
  } else if (state.screen === 'caught') {
    panel(ctx, 340, 220, 600, 240, 0.85);
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SEEN!', CFG.W / 2, 300);
    ctx.fillStyle = '#eaf6ff';
    ctx.font = '19px monospace';
    ctx.fillText('The night shift ends here.', CFG.W / 2, 340);
    ctx.font = '16px monospace';
    ctx.fillText(`Caught by ${state.caughtBy || 'a guard'} · Manifests ${manifestsGot(state)}/3`, CFG.W / 2, 380);
    ctx.fillText('Press R to try again', CFG.W / 2, 420);
    ctx.textAlign = 'left';
  } else if (state.screen === 'win') {
    // Translucent panel: the yard stays visible behind the win card.
    panel(ctx, 340, 180, 600, 300, 0.55);
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 56px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('UNSEEN.', CFG.W / 2, 270);
    ctx.fillStyle = '#ffffff';
    ctx.font = '19px monospace';
    ctx.fillText('Mara slips out the harbour gate with the manifests.', CFG.W / 2, 310);
    ctx.font = '17px monospace';
    const mm = Math.floor(state.winTime / 60), ss = Math.floor(state.winTime % 60);
    ctx.fillText(`Time ${mm}:${String(ss).padStart(2, '0')} · Alarms ${state.alarms} · Loot ${lootGot(state)}/2`, CFG.W / 2, 350);
    ctx.fillText(`Score ${state.score} · Manifests ${manifestsGot(state)}/3`, CFG.W / 2, 380);
    ctx.fillText('Press R to play again', CFG.W / 2, 430);
    ctx.textAlign = 'left';
  }
}

export function render(ctx, state, t) {
  ctx.clearRect(0, 0, CFG.W, CFG.H);
  drawWorld(ctx, state, t);
  drawProps(ctx, state, t);
  drawActors(ctx, state, t);
  drawRain(ctx, state, t);
  if (state.screen !== 'title') drawHUD(ctx, state);
  drawScreens(ctx, state, t);
}
