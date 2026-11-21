// BLACKTIDE — input: keyboard + mouse, nothing else.
// Keys are tracked as a live set so movement reads held keys each frame;
// single-press actions (E, Q, C, P, M, R, Enter) fire once per keydown.
// Mouse is for menu buttons only — the game itself is keyboard-driven.
export function makeInput() {
  return {
    keys: new Set(),
    pressed: new Set(), // consumed by main.js once per frame
    mouse: { x: 0, y: 0, clicked: false },
  };
}

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'run', ShiftRight: 'run',
  KeyC: 'crouch',
  KeyQ: 'bottle',
  KeyE: 'use',
  KeyR: 'restart',
  KeyP: 'pause',
  KeyM: 'mute',
  Enter: 'enter',
  Escape: 'pause',
};

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (e) => {
    const name = KEYMAP[e.code];
    if (!name) return;
    if (['up', 'down', 'left', 'right'].includes(name)) e.preventDefault();
    if (!e.repeat) {
      input.keys.add(name);
      input.pressed.add(name);
    }
  });
  window.addEventListener('keyup', (e) => {
    const name = KEYMAP[e.code];
    if (name) input.keys.delete(name);
  });
  window.addEventListener('blur', () => { input.keys.clear(); });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('click', () => { input.mouse.clicked = true; });
}

// Movement vector from held keys, normalised by the caller.
export function moveVector(input) {
  let dx = 0, dy = 0;
  if (input.keys.has('left')) dx -= 1;
  if (input.keys.has('right')) dx += 1;
  if (input.keys.has('up')) dy -= 1;
  if (input.keys.has('down')) dy += 1;
  return { dx, dy };
}

// Was this action pressed since the last frame? Consumes the press.
export function wasPressed(input, name) {
  if (input.pressed.has(name)) { input.pressed.delete(name); return true; }
  return false;
}
export function clearPressed(input) { input.pressed.clear(); }

