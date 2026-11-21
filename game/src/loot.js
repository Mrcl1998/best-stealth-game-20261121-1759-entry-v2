// BLACKTIDE — loot: the two optional bonus crates plus pickup scoring.
// Loot is never required to win, but a full 2/2 run is the mark of a clean
// infiltration, and the win card shows it. Manifests are the real objective.
import { CFG } from './config.js';

export function manifestsGot(state) {
  return state.world.manifests.filter((m) => m.taken).length;
}
export function lootGot(state) {
  return state.world.loot.filter((l) => l.taken).length;
}

// Try to pick up whatever is in reach: a manifest first, then a loot crate.
// Returns a short label for the HUD toast, or null when nothing is near.
export function tryPickup(state) {
  const p = state.player;
  for (const m of state.world.manifests) {
    if (!m.taken && Math.hypot(p.x - m.x, p.y - m.y) < CFG.pickupRadius) {
      m.taken = true;
      state.score += 500;
      state.toast = `Manifest ${manifestsGot(state)}/3 — ${m.name}`;
      state.toastT = 2.5;
      return 'manifest';
    }
  }
  for (const l of state.world.loot) {
    if (!l.taken && Math.hypot(p.x - l.x, p.y - l.y) < CFG.pickupRadius) {
      l.taken = true;
      state.score += 250;
      state.toast = `Loot ${lootGot(state)}/2 — ${l.name} (+250)`;
      state.toastT = 2.5;
      return 'loot';
    }
  }
  return null;
}

// Can Mara leave? Only with all three manifests in hand.
export function canExit(state) {
  return manifestsGot(state) >= 3;
}
export function atExit(state) {
  const e = state.world.exit;
  const p = state.player;
  return p.x > e.x - CFG.exitRadius && p.x < e.x + e.w + 10
    && p.y > e.y - 10 && p.y < e.y + e.h + 10;
}

