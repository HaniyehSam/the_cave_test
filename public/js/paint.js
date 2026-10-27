// Everything the visitor paints: lines (with symmetry and living effects), fills,
// patterns, and a tile cache so a big painting stays cheap to draw.
import { COLORS } from './config.js';
import { state } from './state.js';

export const TILE = 512;
const LEAF = '#8cc063';

const hex = (name) => (COLORS[name] || COLORS.ink).hex;
const tileKey = (x, y) => `${x},${y}`;

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

// Lines that animate are drawn every frame instead of being baked into tiles.
export const isLive = (s, now) => s.kind === 'line' && (s.fx === 'wiggle' || (s.fx === 'sprout' && now - s.t0 < 1800));

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
  const grow = Math.min(1, (now - stroke.t0) / 1500);
  let travelled = 0, next = 14, n = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const seg = Math.hypot(bx - ax, by - ay);
    travelled += seg;
    while (travelled >= next) {
      n++;
      next += 22 + ((n * 7 + (stroke.seed | 0)) % 13);
      const t = n / 40;
      if (grow < 1 && t > grow * 1.4) return;
      const k = grow < 1 ? Math.min(1, (grow * 1.4 - t) * 4) : 1;
      const angle = Math.atan2(by - ay, bx - ax) + (n % 2 ? 1 : -1) * 0.9;
      const len = (12 + stroke.size * 0.8) * k, petal = (3.6 + stroke.size * 0.15) * k;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(angle);
      if (n % 4 === 0) {
        ctx.fillStyle = ['ink', 'moss'].includes(stroke.color) ? COLORS.blush.hex : hex(stroke.color);
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

const rainbowAt = (stroke, i) => `hsl(${((stroke.seed || 0) * 37 + i * 5) % 360} 68% 58%)`;

export function drawLine(ctx, stroke, now = Date.now()) {
  ctx.save();
  ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
  ctx.strokeStyle = ctx.fillStyle = stroke.erase ? '#000' : hex(stroke.color);
  ctx.lineWidth = stroke.size;
  ctx.lineCap = ctx.lineJoin = 'round';
  if (stroke.glow && !stroke.erase) {
    // shadowBlur is measured in pixels, so scale it with the current zoom.
    ctx.shadowColor = stroke.rainbow ? '#f0b429' : hex(stroke.color);
    ctx.shadowBlur = (stroke.size * 1.4 + 8) * ctx.getTransform().a;
  }
  for (let pts of copies(stroke)) {
    if (stroke.fx === 'wiggle') pts = wiggled(pts, stroke, now);
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0][0], pts[0][1], stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (stroke.rainbow && !stroke.erase) {
      for (let i = 1; i < pts.length; i++) {
        ctx.strokeStyle = rainbowAt(stroke, i);
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

// ---------- Patterns and fills ----------

const patternCache = new Map();

// A small repeating tile: a light wash of the colour with marks on top.
export function patternTile(name, color, size = 24) {
  const k = `${name}|${color}|${size}`;
  if (patternCache.has(k)) return patternCache.get(k);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d'), h = hex(color), u = size / 24;
  x.fillStyle = h;
  if (name === 'solid') x.fillRect(0, 0, size, size);
  else {
    x.globalAlpha = 0.28;
    x.fillRect(0, 0, size, size);
    x.globalAlpha = 1;
  }
  x.strokeStyle = h;
  x.lineCap = 'round';
  if (name === 'stripes') {
    x.lineWidth = 5 * u;
    for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(i * size, size); x.lineTo(i * size + size, 0); x.stroke(); }
  } else if (name === 'dots') {
    for (const [px, py] of [[6, 6], [18, 18]]) { x.beginPath(); x.arc(px * u, py * u, 3.6 * u, 0, Math.PI * 2); x.fill(); }
  } else if (name === 'checks') {
    x.fillRect(0, 0, 12 * u, 12 * u);
    x.fillRect(12 * u, 12 * u, 12 * u, 12 * u);
  } else if (name === 'waves') {
    x.lineWidth = 2.4 * u;
    for (const oy of [6, 18]) {
      x.beginPath();
      for (let px = 0; px <= 24; px++) x.lineTo(px * u, (oy + Math.sin((px / 24) * Math.PI * 2) * 3) * u);
      x.stroke();
    }
  } else if (name === 'stars') {
    const star = (cx, cy, r) => {
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
        x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      x.fill();
    };
    star(7 * u, 7 * u, 5 * u);
    star(18 * u, 17 * u, 3.4 * u);
  } else if (name === 'bricks') {
    x.lineWidth = 1.6 * u;
    x.strokeRect(0, 0, 24 * u, 12 * u);
    x.strokeRect(-12 * u, 12 * u, 24 * u, 12 * u);
    x.strokeRect(12 * u, 12 * u, 24 * u, 12 * u);
  } else if (name === 'confetti') {
    // Confetti ignores the chosen colour a little: it is a party.
    const hues = [h, COLORS.coral.hex, COLORS.marigold.hex, COLORS.teal.hex, COLORS.lavender.hex];
    [[4, 5, 0.3], [15, 3, 1.2], [20, 14, 2.1], [8, 17, 0.8], [13, 10, 2.6]].forEach(([px, py, a], i) => {
      x.save();
      x.translate(px * u, py * u);
      x.rotate(a);
      x.fillStyle = hues[i];
      x.fillRect(-2.6 * u, -1.2 * u, 5.2 * u, 2.4 * u);
      x.restore();
    });
  } else if (name === 'swirls') {
    x.lineWidth = 1.8 * u;
    x.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) x.lineTo((12 + Math.cos(a) * a * 0.7) * u, (12 + Math.sin(a) * a * 0.7) * u);
    x.stroke();
  } else if (name === 'scales') {
    x.lineWidth = 1.7 * u;
    for (const [px, py] of [[0, 12], [12, 0], [24, 12], [12, 24], [0, 36], [24, 36]]) {
      x.beginPath();
      x.arc(px * u, py * u, 12 * u, 0, Math.PI);
      x.stroke();
    }
  } else if (name === 'herringbone') {
    x.lineWidth = 3 * u;
    for (let i = -1; i < 3; i++) {
      x.beginPath();
      x.moveTo(0, (i * 12 + 6) * u);
      x.lineTo(12 * u, i * 12 * u);
      x.lineTo(24 * u, (i * 12 + 6) * u);
      x.stroke();
    }
  }
  patternCache.set(k, c);
  return c;
}

export function loadFill(stroke) {
  if (stroke._mask) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { stroke._mask = img; stroke._canvas = null; resolve(); };
    img.onerror = () => resolve();
    img.src = stroke.mask;
  });
}

// The coloured fill: the pattern is anchored to the world so neighbouring fills line up.
function fillCanvas(stroke) {
  if (stroke._canvas) return stroke._canvas;
  if (!stroke._mask) return null;
  const c = document.createElement('canvas');
  c.width = stroke.w;
  c.height = stroke.h;
  const x = c.getContext('2d');
  const pattern = x.createPattern(patternTile(stroke.pattern || 'solid', stroke.color), 'repeat');
  pattern.setTransform(new DOMMatrix().translate(-stroke.x % 24, -stroke.y % 24));
  x.fillStyle = pattern;
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
}
export function reindex() {
  index.clear();
  tiles.clear();
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
    if (s && !isLive(s, now)) drawStroke(ctx, s, now);
  }
  tiles.set(k, c);
  while (tiles.size > 36) tiles.delete(tiles.keys().next().value);
  return c;
}

// Draws all paint inside the world rectangle `view` onto ctx (already in world units).
export function drawPaint(ctx, view, res, now) {
  if (res !== tileRes) {
    tileRes = res;
    tiles.clear();
  }
  for (const k of tileKeys(view)) {
    if (!index.has(k)) continue;
    const [tx, ty] = k.split(',').map(Number);
    ctx.drawImage(tile(k, now), tx * TILE, ty * TILE, TILE, TILE);
  }
  let settling = false;
  for (const s of state.strokes) {
    if (!isLive(s, now)) continue;
    const b = bounds(s);
    if (b.x > view.x + view.w || b.y > view.y + view.h || b.x + b.w < view.x || b.y + b.h < view.y) continue;
    drawStroke(ctx, s, now);
    if (s.fx === 'sprout') settling = true;
  }
  if (state.active) drawLine(ctx, state.active, now);
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
export const hasWiggles = () => state.strokes.some((s) => s.fx === 'wiggle');
