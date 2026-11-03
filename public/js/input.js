// Pointer, wheel and keyboard: draw with one pointer, move with two fingers,
// the middle button, the hand tool or space. The zoom is locked: pinching only moves,
// and the browser's own zoom (ctrl+wheel, ctrl +/-) is blocked.
import { MODS } from './config.js';
import { state, markDirty, clampCamera } from './state.js';
import { canvas, toWorld } from './render.js';
import { commit, pick, undo, redo } from './actions.js';
import { cutsFor } from './paint.js';
import { save } from './store.js';
import { update, hideBubble, anyDialogOpen, openDish, toggleTray, closeTrays, pickColour } from './ui.js';

const pointers = new Map();
let space = false;
let pinch = null;

const round = (v) => Math.round(v * 10) / 10;
const touches = () => [...pointers.values()].filter((p) => p.type === 'touch');

function pan(dx, dy) {
  const cam = state.camera;
  state.camera = clampCamera({ ...cam, x: cam.x - dx / cam.zoom, y: cam.y - dy / cam.zoom });
  markDirty();
  save();
}

function newStroke(p) {
  const erase = state.tool === 'eraser', cam = state.camera;
  const sym = state.mods.kaleido ? { type: 'kaleido', cx: round(cam.x), cy: round(cam.y), n: 6 }
    : state.mods.mirror ? { type: 'mirror', cx: round(cam.x) } : null;
  const fx = erase ? null : state.mods.wiggle ? 'wiggle' : state.mods.sprout ? 'sprout' : null;
  return {
    kind: 'line', color: state.color, size: erase ? state.size * 2 + 6 : state.size, erase,
    points: [[round(p.x), round(p.y)]], sym, fx, seed: Math.floor(Math.random() * 100), t0: Date.now(),
    glow: !erase && state.mods.glow,
  };
}

function finishStroke() {
  const s = state.active;
  state.active = null;
  if (!s) return;
  if (s.erase) {
    // Drawings that move are taken away whole by the eraser.
    const cuts = cutsFor(s, Date.now());
    if (cuts.length) s.cuts = cuts;
  }
  commit(s);
}

function onDown(e) {
  if (e.button === 2) return;
  e.preventDefault();
  canvas.focus({ preventScroll: true });
  try { canvas.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
  const p = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, type: e.pointerType, action: 'draw' };
  pointers.set(e.pointerId, p);

  const fingers = touches();
  if (p.type === 'touch' && fingers.length > 1) {
    state.active = null;          // the first finger was the start of a gesture, not a line
    for (const f of fingers) f.action = 'pinch';
    const [a, b] = fingers;
    pinch = { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    markDirty();
    return;
  }
  if (e.button === 1 || state.moving || space) {
    p.action = 'pan';
    canvas.classList.add('dragging');
    return;
  }
  // Always start a line: dragging over people colours them in. A tap on someone talks instead (see onUp).
  const w = toWorld(e.clientX, e.clientY);
  hideBubble();
  closeTrays();
  state.active = newStroke(w);
  markDirty();
}

function onMove(e) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  e.preventDefault();
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (p.action === 'pinch') {
    const [a, b] = touches();
    if (!a || !b || !pinch) return;
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    pan(cx - pinch.cx, cy - pinch.cy);
    pinch = { cx, cy };
    return;
  }
  if (p.action === 'pan') return pan(dx, dy);
  if (p.action !== 'draw' || !state.active) return;
  const samples = e.getCoalescedEvents?.() || [];
  for (const sample of samples.length ? samples : [e]) {
    const w = toWorld(sample.clientX, sample.clientY), pts = state.active.points, last = pts[pts.length - 1];
    if (Math.hypot(w.x - last[0], w.y - last[1]) > 1.2 / state.camera.zoom) pts.push([round(w.x), round(w.y)]);
  }
  markDirty();
}

function onUp(e, cancelled = false) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  pointers.delete(e.pointerId);
  const still = Math.hypot(p.x - p.sx, p.y - p.sy) < 8;
  if (p.action === 'draw') {
    const w = toWorld(p.x, p.y);
    if (cancelled) state.active = null;
    else if (still && pick(w.x, w.y, 30 / state.camera.zoom)) state.active = null;
    else finishStroke();
  } else if (p.action === 'pan' && still && !cancelled) {
    const w = toWorld(p.x, p.y);
    pick(w.x, w.y, 30 / state.camera.zoom);
  } else if (p.action === 'pinch') {
    pinch = null;
    for (const f of touches()) f.action = 'pan';   // keep moving with the finger that stays
  }
  if (!pointers.size) canvas.classList.remove('dragging');
  markDirty();
}

function onWheel(e) {
  e.preventDefault();
  if (anyDialogOpen() || e.ctrlKey || e.metaKey) return;
  const unit = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? state.view.height : 1;
  const sideways = e.shiftKey && !e.deltaX;
  pan(-(sideways ? e.deltaY : e.deltaX) * unit, -(sideways ? 0 : e.deltaY) * unit);
}

const toolKeys = { b: 'pencil', e: 'eraser' };
const modKeys = { m: 'mirror', k: 'kaleido', w: 'wiggle', g: 'sprout', l: 'glow' };

// The browser's zoom keys: ctrl (or cmd) with +, -, = or 0, on the main keys or the number pad.
const zoomKeys = new Set(['+', '-', '=', '_', '0', 'add', 'subtract']);
const zoomCodes = new Set(['Equal', 'Minus', 'Digit0', 'NumpadAdd', 'NumpadSubtract', 'Numpad0']);

function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && (zoomKeys.has(e.key.toLowerCase()) || zoomCodes.has(e.code))) return e.preventDefault();
  if (anyDialogOpen() || e.altKey) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') {
    e.preventDefault();
    return e.shiftKey ? redo() : undo();
  }
  if ((e.ctrlKey || e.metaKey) && k === 'y') {
    e.preventDefault();
    return redo();
  }
  if (e.ctrlKey || e.metaKey) return;
  if (k === ' ') {
    e.preventDefault();
    if (!space) { space = true; finishStroke(); canvas.classList.add('moving'); }
    return;
  }
  if (k === 'escape') {
    closeTrays();
    return hideBubble();
  }
  if (k === 'x' && state.found.has('tool:dish')) return openDish();
  if (k === 'c') return toggleTray('colour');
  if (k === 'i') return document.getElementById('ideaBtn').click();
  if (k === 'q') return toggleTray('magic');
  if (/^[1-9]$/.test(k)) return pickColour(Number(k) - 1);
  if (toolKeys[k] && state.found.has(`tool:${toolKeys[k]}`)) {
    state.tool = toolKeys[k];
    state.moving = false;
  } else if (modKeys[k] && state.found.has(`mod:${modKeys[k]}`)) {
    document.querySelector(`#mods button[aria-label="${MODS[modKeys[k]].name}"]`)?.click();
    return;
  } else if (k === 'h') state.moving = !state.moving;
  else if (k === 's') return document.getElementById('sizeBtn').click();
  else if (k.startsWith('arrow')) {
    e.preventDefault();
    const step = 120;
    return pan(k === 'arrowleft' ? step : k === 'arrowright' ? -step : 0, k === 'arrowup' ? step : k === 'arrowdown' ? -step : 0);
  } else return;
  update();
  save();
}

export function initInput() {
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', (e) => onUp(e));
  canvas.addEventListener('pointercancel', (e) => onUp(e, true));
  canvas.addEventListener('lostpointercapture', (e) => onUp(e, true));
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  // Ctrl+wheel (and trackpad pinch, which arrives as one) anywhere on the page, not just the canvas.
  addEventListener('wheel', (e) => (e.ctrlKey || e.metaKey) && e.preventDefault(), { passive: false });
  // Safari's own pinch-to-zoom.
  for (const type of ['gesturestart', 'gesturechange']) document.addEventListener(type, (e) => e.preventDefault());
  addEventListener('keydown', onKey);
  addEventListener('keyup', (e) => {
    if (e.key === ' ') {
      space = false;
      canvas.classList.toggle('moving', state.moving);
    }
  });
  addEventListener('blur', () => {
    finishStroke();
    pointers.clear();
    space = false;
    save(true);
  });
  document.addEventListener('visibilitychange', () => document.hidden && save(true));
}
