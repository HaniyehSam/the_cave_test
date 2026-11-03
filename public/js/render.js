// Draws one frame: drifting clouds, artwork, colour washes, paint (multiplied so ink stays
// on top), hidden pictures, traffic, drawing ideas, finds, and everything that has come alive.
import { SECTION, PAPER } from './config.js';
import { state } from './state.js';
import { ensureSection, raster, keepOnly, worldFinds, findVisible, secretId, isLoading, photoLayer } from './world.js';
import { drawPaint, settleSprouts, hasMovingLines } from './paint.js';
import { drawFind } from './finds.js';
import { drawIdeas, hiddenOnScreen, fitInside, paradeGroups } from './ideas.js';
import { drawSky, drawFlyers, drawTraffic, drawParade } from './ambient.js';

export const canvas = document.getElementById('world');
const screen = canvas.getContext('2d');
const paintLayer = document.createElement('canvas');
const liveLayer = document.createElement('canvas');
const revealLayer = document.createElement('canvas');

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
  drawSky(ctx, rect, t);

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
    if (!layer) continue;
    // Photos pasted up as whole buildings are solid prints: clouds go behind them.
    ctx.globalCompositeOperation = s.zone.empty ? 'source-over' : 'multiply';
    ctx.drawImage(layer, s.col * SECTION, s.row * SECTION, SECTION, SECTION);
  }
  ctx.globalCompositeOperation = 'multiply';
  for (const s of shown) {
    const w = s.zone ? state.shownWarmth[s.zone.id] || 0 : 0;
    if (!s.wash || w <= 0.01) continue;
    ctx.globalAlpha = Math.min(1, w);
    ctx.drawImage(s.wash, s.col * SECTION, s.row * SECTION, SECTION, SECTION);
  }
  ctx.restore();

  // 3. Paint, on its own layer, multiplied onto the paper. Lines that move are drawn on a
  // second layer first, so an eraser only rubs out what was drawn before it.
  const pw = Math.max(1, Math.round(width * dpr)), ph = Math.max(1, Math.round(height * dpr));
  const layers = [paintLayer, liveLayer].map((layer) => {
    if (layer.width !== pw || layer.height !== ph) {
      layer.width = pw;
      layer.height = ph;
    }
    const c = layer.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, pw, ph);
    c.setTransform(...toWorldMatrix);
    return c;
  });
  const [p, live] = layers;
  if (drawPaint(p, live, rect, res, now)) animating = true;
  settleSprouts(now);
  if (hasMovingLines()) animating = true;
  p.setTransform(1, 0, 0, 1, 0, 0);
  p.drawImage(liveLayer, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(paintLayer, 0, 0);
  ctx.restore();

  // 4. Hidden pictures show through wherever there is paint, then the traffic and the ideas.
  for (const h of hiddenOnScreen(shown, rect)) if (revealHidden(ctx, h, toWorldMatrix, pw, ph)) animating = true;
  // Once the town holds its parade, the traffic gives the road over to your drawings.
  if (state.paraded) drawParade(ctx, rect, t, paradeGroups());
  else drawTraffic(ctx, rect, t);
  drawIdeas(ctx, shown, rect, t);

  // 5. Living things and finds, on top of everything.
  for (const s of shown) {
    const zone = s.zone;
    if (!zone) continue;
    const warmth = state.shownWarmth[zone.id] || 0;
    const has = (id) => state.secrets.has(secretId(zone, { id })) || state.ideas.has(secretId(zone, { id }));
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

  drawFlyers(ctx, rect, t);

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

// A hidden picture: only the parts under paint, until enough is uncovered to show it all.
function revealHidden(ctx, h, m, pw, ph) {
  const pic = fitInside(h.img, h.box);
  if (h.done) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, h.since / 900);
    ctx.drawImage(h.img, pic.x, pic.y, pic.w, pic.h);
    ctx.restore();
    return h.since < 900;
  }
  const [k, , , , e, f] = m;
  const x = Math.floor(pic.x * k + e), y = Math.floor(pic.y * k + f), w = Math.ceil(pic.w * k), hh = Math.ceil(pic.h * k);
  const sx = Math.max(0, x), sy = Math.max(0, y), cw = Math.min(pw, x + w) - sx, ch = Math.min(ph, y + hh) - sy;
  if (cw <= 0 || ch <= 0) return false;
  revealLayer.width = cw;
  revealLayer.height = ch;
  const r = revealLayer.getContext('2d');
  r.drawImage(paintLayer, sx, sy, cw, ch, 0, 0, cw, ch);
  r.globalCompositeOperation = 'source-in';
  r.drawImage(h.img, x - sx, y - sy, w, hh);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(revealLayer, sx, sy);
  ctx.restore();
  return false;
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
