// Everything the visitor draws: lines (with symmetry and living effects), fills,
// drawings that have come alive, and a tile cache so a big picture stays cheap to draw.
import { COLORS, colorHex } from './config.js';
import { state } from './state.js';

export const TILE = 512;
const LEAF = '#8cc063';

const tileKey = (x, y) => `${x},${y}`;
export const isRainbow = (s) => s.color === 'rainbow' || !!s.rainbow;

// ---------- Symmetry ----------

// Every copy of a line's points that symmetry produces, as arrays of [x, y].
export function copies(stroke) {
  const pts = stroke.points;
  const sym = stroke.sym;
  if (!sym) return [pts];
  if (sym.type === 'mirror') return [pts, pts.map(([x, y]) => [2 * sym.cx - x, y])];
  const out = [];
  for (let k = 0; k < sym.n; k++) {
    const a = (k * Math.PI * 2) / sym.n, cos = Math.cos(a), sin = Math.sin(a);
    for (const flip of [1, -1]) {
      out.push(pts.map(([x, y]) => {
        const dx = x - sym.cx, dy = (y - sym.cy) * flip;
        return [sym.cx + dx * cos - dy * sin, sym.cy + dx * sin + dy * cos];
      }));
    }
  }
  return out;
}

export function bounds(stroke) {
  if (stroke._bounds) return stroke._bounds;
  if (stroke.kind === 'fill') return (stroke._bounds = { x: stroke.x, y: stroke.y, w: stroke.w, h: stroke.h });
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const pts of copies(stroke)) for (const [x, y] of pts) {
    if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
  }
  const pad = stroke.size / 2 + 3 + (stroke.fx === 'wiggle' ? 4 + stroke.size * 0.25 : 0) + (stroke.fx === 'sprout' ? 22 + stroke.size : 0) +
    (stroke.glow ? stroke.size * 2 + 16 : 0);
  return (stroke._bounds = { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 });
}
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const grow = (b, r) => ({ x: b.x - r, y: b.y - r, w: b.w + r * 2, h: b.h + r * 2 });

// Lines that move are drawn every frame instead of being baked into tiles.
// `_anim` is set on lines inside a finished drawing idea, which has come alive.
export const isLive = (s, now) => s.kind === 'line' && !s.erase &&
  (s.fx === 'wiggle' || (s.fx === 'sprout' && now - s.t0 < 1800) || !!s._anim);

// ---------- Drawing lines ----------

function smoothPath(ctx, pts) {
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length < 3) {
    for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
    return;
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
}

function wiggled(pts, stroke, now) {
  const amp = 1.8 + stroke.size * 0.18, t = now * 0.004, s = stroke.seed || 0;
  return pts.map(([x, y], i) => [x + Math.sin(t + i * 0.33 + s) * amp, y + Math.cos(t * 0.93 + i * 0.27 + s) * amp]);
}

// Leaves (and the odd flower) unfurl along a sprouting line.
function drawSprouts(ctx, pts, stroke, now) {
  const grown = Math.min(1, (now - stroke.t0) / 1500);
  let travelled = 0, next = 14, n = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const seg = Math.hypot(bx - ax, by - ay);
    travelled += seg;
    while (travelled >= next) {
      n++;
      next += 22 + ((n * 7 + (stroke.seed | 0)) % 13);
      const t = n / 40;
      if (grown < 1 && t > grown * 1.4) return;
      const k = grown < 1 ? Math.min(1, (grown * 1.4 - t) * 4) : 1;
      const angle = Math.atan2(by - ay, bx - ax) + (n % 2 ? 1 : -1) * 0.9;
      const len = (12 + stroke.size * 0.8) * k, petal = (3.6 + stroke.size * 0.15) * k;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(angle);
      if (n % 4 === 0) {
        ctx.fillStyle = stroke.color === 'ink' || isRainbow(stroke) ? COLORS.blush.hex : colorHex(stroke.color);
        for (let p = 0; p < 5; p++) {
          ctx.beginPath();
          ctx.arc(len * 0.8 + Math.cos(p * 1.26) * petal * 1.2, Math.sin(p * 1.26) * petal * 1.2, petal, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = COLORS.marigold.hex;
        ctx.beginPath();
        ctx.arc(len * 0.8, 0, petal * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = LEAF;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.5, -len * 0.45, len, 0);
        ctx.quadraticCurveTo(len * 0.5, len * 0.45, 0, 0);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

export const rainbowAt = (seed, i) => `hsl(${((seed || 0) * 37 + i * 5) % 360} 68% 58%)`;

export function drawLine(ctx, stroke, now = Date.now()) {
  const rainbow = isRainbow(stroke) && !stroke.erase;
  ctx.save();
  ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
  ctx.strokeStyle = ctx.fillStyle = stroke.erase ? '#000' : colorHex(stroke.color);
  ctx.lineWidth = stroke.size;
  ctx.lineCap = ctx.lineJoin = 'round';
  if (stroke.glow && !stroke.erase) {
    // shadowBlur is measured in pixels, so scale it with the current zoom.
    ctx.shadowColor = rainbow ? '#f0b429' : colorHex(stroke.color);
    ctx.shadowBlur = (stroke.size * 1.4 + 8) * Math.hypot(ctx.getTransform().a, ctx.getTransform().b);
  }
  for (let pts of copies(stroke)) {
    if (stroke.fx === 'wiggle') pts = wiggled(pts, stroke, now);
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0][0], pts[0][1], stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (rainbow) {
      for (let i = 1; i < pts.length; i++) {
        ctx.strokeStyle = rainbowAt(stroke.seed, i);
        ctx.beginPath();
        ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
        ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      smoothPath(ctx, pts);
      ctx.stroke();
    }
    if (stroke.fx === 'sprout' && !stroke.erase) drawSprouts(ctx, pts, stroke, now);
  }
  ctx.restore();
}

// ---------- Fills ----------

export function loadFill(stroke) {
  if (stroke._mask) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { stroke._mask = img; stroke._canvas = null; resolve(); };
    img.onerror = () => resolve();
    img.src = stroke.mask;
  });
}

// The coloured fill: one flat colour, or rainbow bands for the rainbow paint.
function fillCanvas(stroke) {
  if (stroke._canvas) return stroke._canvas;
  if (!stroke._mask) return null;
  const c = document.createElement('canvas');
  c.width = stroke.w;
  c.height = stroke.h;
  const x = c.getContext('2d');
  if (isRainbow(stroke)) {
    const g = x.createLinearGradient(0, 0, c.width, c.height);
    for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${i * 55} 68% 60%)`);
    x.fillStyle = g;
  } else x.fillStyle = colorHex(stroke.color);
  x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(stroke._mask, 0, 0);
  return (stroke._canvas = c);
}

export function drawStroke(ctx, stroke, now) {
  if (stroke.kind === 'fill') {
    const c = fillCanvas(stroke);
    if (c) ctx.drawImage(c, stroke.x, stroke.y);
  } else drawLine(ctx, stroke, now);
}

// A line that has come alive, moved by its drawing's animation.
function drawAlive(ctx, stroke, now) {
  ctx.save();
  ctx.transform(...stroke._anim.matrix(now));
  drawLine(ctx, stroke, now);
  ctx.restore();
}

// ---------- Erasing living lines ----------
// Moving drawings cannot be rubbed out where they used to be, so the eraser takes away
// any living line it touches, whole. The erase line remembers which ones (`cuts`), so undo works.

const cut = new Set();   // indices of lines an eraser has taken away
export const isCut = (i) => cut.has(i);

export function cutsFor(eraser, now) {
  const hits = [], reach = eraser.size / 2;
  const eb = bounds(eraser);
  state.strokes.forEach((s, i) => {
    if (!s._anim || cut.has(i)) return;
    const m = new DOMMatrix(s._anim.matrix(now)), inv = m.inverse();
    if (!overlaps(grow(bounds(s), s._anim.reach), eb)) return;
    const near = reach + s.size / 2;
    for (const [ex, ey] of eraser.points) {
      const p = inv.transformPoint({ x: ex, y: ey });
      if (copies(s).some((pts) => pts.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < near))) {
        hits.push(i);
        return;
      }
    }
  });
  return hits;
}

// ---------- Tile cache ----------

const index = new Map();   // tile key -> stroke indices touching it
const tiles = new Map();   // tile key -> canvas
let tileRes = 1;

function tileKeys(b) {
  const out = [];
  for (let y = Math.floor(b.y / TILE); y <= Math.floor((b.y + b.h) / TILE); y++)
    for (let x = Math.floor(b.x / TILE); x <= Math.floor((b.x + b.w) / TILE); x++) out.push(tileKey(x, y));
  return out;
}

export function indexStroke(stroke, i) {
  for (const k of tileKeys(bounds(stroke))) {
    if (!index.has(k)) index.set(k, []);
    index.get(k).push(i);
    tiles.delete(k);
  }
  for (const c of stroke.cuts || []) cut.add(c);
}
export function reindex() {
  index.clear();
  tiles.clear();
  cut.clear();
  state.strokes.forEach(indexStroke);
}
export const invalidate = (b) => tileKeys(b).forEach((k) => tiles.delete(k));

function tile(k, now) {
  if (tiles.has(k)) {
    const t = tiles.get(k);
    tiles.delete(k);
    tiles.set(k, t);
    return t;
  }
  const [tx, ty] = k.split(',').map(Number);
  const c = document.createElement('canvas');
  c.width = c.height = Math.ceil(TILE * tileRes);
  const ctx = c.getContext('2d');
  ctx.setTransform(tileRes, 0, 0, tileRes, -tx * TILE * tileRes, -ty * TILE * tileRes);
  for (const i of index.get(k)) {
    const s = state.strokes[i];
    if (s && !cut.has(i) && !isLive(s, now)) drawStroke(ctx, s, now);
  }
  tiles.set(k, c);
  while (tiles.size > 36) tiles.delete(tiles.keys().next().value);
  return c;
}

// Draws all paint inside the world rectangle `view`: settled paint onto ctx, and lines that
// move onto `live`, a separate layer so erasers only rub out what was drawn before them.
// Both contexts are already in world units. Returns true while something is still growing.
export function drawPaint(ctx, live, view, res, now) {
  if (res !== tileRes) {
    tileRes = res;
    tiles.clear();
  }
  for (const k of tileKeys(view)) {
    if (!index.has(k)) continue;
    const [tx, ty] = k.split(',').map(Number);
    ctx.drawImage(tile(k, now), tx * TILE, ty * TILE, TILE, TILE);
  }
  let settling = false, liveBoxes = [];
  const alive = [];
  state.strokes.forEach((s, i) => {
    if (cut.has(i)) return;
    if (s._anim) {
      if (overlaps(grow(bounds(s), s._anim.reach), view)) alive.push(s);
      return;
    }
    if (isLive(s, now)) {
      const b = bounds(s);
      if (!overlaps(b, view)) return;
      drawStroke(live, s, now);
      liveBoxes.push(b);
      if (s.fx === 'sprout') settling = true;
    } else if (s.erase && liveBoxes.length) {
      const b = bounds(s);
      if (liveBoxes.some((l) => overlaps(l, b))) drawLine(live, s, now);
    }
  });
  for (const s of alive) drawAlive(live, s, now);
  if (state.active) {
    drawLine(ctx, state.active, now);
    if (state.active.erase) drawLine(live, state.active, now);
  }
  return settling;
}

// A sprout that just finished growing gets baked into its tiles.
export function settleSprouts(now) {
  for (const s of state.strokes)
    if (s.fx === 'sprout' && !s._settled && now - s.t0 >= 1800) {
      s._settled = true;
      invalidate(bounds(s));
    }
}
export const hasMovingLines = () => state.strokes.some((s) => s.fx === 'wiggle' || s._anim);
