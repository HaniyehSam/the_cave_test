// Draws one frame: artwork, colour washes, paint (multiplied so ink stays on top),
// collectable finds, and the little animations of zones that have come alive.
import { SECTION, PAPER } from './config.js';
import { state } from './state.js';
import { zones, ensureSection, raster, keepOnly, worldFinds, findVisible, secretId, isLoading, photoLayer } from './world.js';
import { drawPaint, settleSprouts, hasWiggles } from './paint.js';
import { drawFind } from './finds.js';

export const canvas = document.getElementById('world');
const screen = canvas.getContext('2d');
const paintLayer = document.createElement('canvas');

export function viewRect(cam = state.camera, view = state.view) {
  const w = view.width / cam.zoom, h = view.height / cam.zoom;
  return { x: cam.x - w / 2, y: cam.y - h / 2, w, h };
}
export const toWorld = (sx, sy) => ({
  x: state.camera.x + (sx - state.view.width / 2) / state.camera.zoom,
  y: state.camera.y + (sy - state.view.height / 2) / state.camera.zoom,
});
export const toScreen = (wx, wy) => ({
  x: (wx - state.camera.x) * state.camera.zoom + state.view.width / 2,
  y: (wy - state.camera.y) * state.camera.zoom + state.view.height / 2,
});

export function visibleCells(rect = viewRect(), buffer = 0) {
  const out = [];
  for (let row = Math.floor(rect.y / SECTION) - buffer; row <= Math.floor((rect.y + rect.h) / SECTION) + buffer; row++)
    for (let col = Math.floor(rect.x / SECTION) - buffer; col <= Math.floor((rect.x + rect.w) / SECTION) + buffer; col++)
      out.push({ col, row, k: `${col},${row}` });
  return out;
}

// Raster resolution in half steps, so small zoom changes reuse the same images.
const quantize = (scale) => Math.min(3, Math.max(0.5, Math.ceil(scale * 2) / 2));

function easeWarmth() {
  let moving = false;
  for (const [id, target] of Object.entries(state.warmth)) {
    const shown = state.shownWarmth[id] ?? 0;
    if (Math.abs(target - shown) < 0.002) { state.shownWarmth[id] = target; continue; }
    state.shownWarmth[id] = shown + (target - shown) * 0.04;
    moving = true;
  }
  return moving;
}

// Renders the camera view into ctx. Returns true while something is animating.
export function render(ctx = screen, { width, height, dpr } = state.view, cam = state.camera) {
  const now = Date.now(), t = performance.now();
  const scale = cam.zoom * dpr, res = quantize(scale);
  const toWorldMatrix = [scale, 0, 0, scale, (width / 2 - cam.x * cam.zoom) * dpr, (height / 2 - cam.y * cam.zoom) * dpr];
  const rect = viewRect(cam, { width, height });
  const cells = visibleCells(rect);
  let animating = easeWarmth();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(...toWorldMatrix);

  // 1. Artwork, with revealed secrets baked in.
  const shown = [];
  for (const cell of cells) {
    const s = ensureSection(cell.col, cell.row);
    const img = raster(s, res);
    if (!img) continue;
    // Overlap neighbours by one device pixel so no hairline seam shows between sections.
    ctx.drawImage(img, cell.col * SECTION, cell.row * SECTION, SECTION + 1 / scale, SECTION + 1 / scale);
    shown.push(s);
  }

  // 2. The photo collage, then colour washes, both fading towards colour as a zone warms up.
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (const s of shown) {
    const layer = photoLayer(s, s.zone ? state.shownWarmth[s.zone.id] || 0 : 0);
    if (layer) ctx.drawImage(layer, s.col * SECTION, s.row * SECTION, SECTION, SECTION);
  }
  for (const s of shown) {
    const w = s.zone ? state.shownWarmth[s.zone.id] || 0 : 0;
    if (!s.wash || w <= 0.01) continue;
    ctx.globalAlpha = Math.min(1, w);
    ctx.drawImage(s.wash, s.col * SECTION, s.row * SECTION, SECTION, SECTION);
  }
  ctx.restore();

  // 3. Paint, on its own layer, multiplied onto the paper.
  const pw = Math.max(1, Math.round(width * dpr)), ph = Math.max(1, Math.round(height * dpr));
  if (paintLayer.width !== pw || paintLayer.height !== ph) {
    paintLayer.width = pw;
    paintLayer.height = ph;
  }
  const p = paintLayer.getContext('2d');
  p.setTransform(1, 0, 0, 1, 0, 0);
  p.clearRect(0, 0, pw, ph);
  p.setTransform(...toWorldMatrix);
  if (drawPaint(p, rect, res, now)) animating = true;
  settleSprouts(now);
  if (hasWiggles()) animating = true;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(paintLayer, 0, 0);
  ctx.restore();

  // 4. Living things and finds, on top of everything.
  for (const s of shown) {
    const zone = s.zone;
    if (!zone) continue;
    const warmth = state.shownWarmth[zone.id] || 0;
    const has = (id) => state.secrets.has(secretId(zone, { id }));
    if (zone.alive) {
      ctx.save();
      ctx.translate(s.col * SECTION, s.row * SECTION);
      zone.alive(ctx, t, { warmth, has });
      ctx.restore();
      animating = true;
    }
    for (const f of worldFinds(zone)) {
      if (!findVisible(zone, f)) continue;
      drawFind(ctx, f, t);
      animating = true;
    }
  }

  if (ctx === screen && edgeHint(ctx, rect, t, dpr, cam, width, height)) animating = true;

  // Symmetry guides while a symmetry magic is on.
  if (ctx === screen && (state.mods.mirror || state.mods.kaleido) && !state.moving) {
    ctx.save();
    ctx.setLineDash([4 / cam.zoom, 8 / cam.zoom]);
    ctx.strokeStyle = '#29282444';
    ctx.lineWidth = 1 / cam.zoom;
    ctx.beginPath();
    if (state.mods.kaleido) {
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        ctx.moveTo(cam.x, cam.y);
        ctx.lineTo(cam.x + Math.cos(a) * 2000, cam.y + Math.sin(a) * 2000);
      }
    } else {
      ctx.moveTo(cam.x, rect.y);
      ctx.lineTo(cam.x, rect.y + rect.h);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (ctx === screen) {
    const near = visibleCells(rect, 1);
    for (const c of near) ensureSection(c.col, c.row);   // fetch neighbours before they scroll in
    keepOnly(new Set(near.map((c) => c.k)));
  }
  return animating || isLoading();
}

// When nothing on screen is left to find, a glimmer at the edge points to the nearest find.
function edgeHint(ctx, rect, t, dpr, cam, width, height) {
  let best = null, bestD = 2200, onScreen = false;
  for (const zone of zones)
    for (const f of worldFinds(zone)) {
      if (!findVisible(zone, f)) continue;
      if (f.wx > rect.x && f.wx < rect.x + rect.w && f.wy > rect.y && f.wy < rect.y + rect.h) onScreen = true;
      const d = Math.hypot(f.wx - cam.x, f.wy - cam.y);
      if (d < bestD) { bestD = d; best = f; }
    }
  if (onScreen || !best) return false;
  const a = Math.atan2(best.wy - cam.y, best.wx - cam.x), m = 34;
  const k = Math.min((width / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (height / 2 - m - 50) / Math.abs(Math.sin(a) || 1e-6));
  const x = width / 2 + Math.cos(a) * k, y = height / 2 + Math.sin(a) * k, pulse = (Math.sin(t / 420) + 1) / 2;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(x, y);
  ctx.globalAlpha = 0.45 + pulse * 0.45;
  ctx.fillStyle = '#f0b429';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? 3.5 : 12 + pulse * 4, b = (i * Math.PI) / 4 + t / 1600;
    ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r);
  }
  ctx.fill();
  ctx.rotate(a);
  ctx.strokeStyle = '#292824';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(20, -6);
  ctx.lineTo(27, 0);
  ctx.lineTo(20, 6);
  ctx.stroke();
  ctx.restore();
  return true;
}

let animating = true;
export function startLoop(onFrame) {
  const frame = () => {
    requestAnimationFrame(frame);
    if (!state.dirty && !animating) return;
    state.dirty = false;
    try {
      animating = render();
    } catch (err) {
      // A bad frame must never stop the world from drawing again.
      console.error(err);
      animating = true;
    }
    onFrame?.();
  };
  requestAnimationFrame(frame);
}

export function resize() {
  const v = state.view;
  v.width = Math.max(1, innerWidth);
  v.height = Math.max(1, innerHeight);
  v.dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(v.width * v.dpr);
  canvas.height = Math.round(v.height * v.dpr);
  state.dirty = true;
}
