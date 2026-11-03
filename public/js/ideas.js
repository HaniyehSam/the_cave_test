// Drawing ideas: dotted drawings to trace, blank spaces to draw in, pictures hidden under
// the paper, and the panels of the story cave. Finishing one brings your drawing to life.
//
// A zone lists them as `ideas`, in zone coordinates:
//   { id, type: 'trace', shape, x, y, s, flip, anim }   x, y is the shape's centre
//   { id, type: 'space', x, y, w, h, need, anim }       a box to draw anything in
//   { id, type: 'hidden', x, y, w, h, photo }           draw over it to uncover the photo
//   { id, type: 'space', story: n, text: 'Long ago, {a} lived here.', ... }   a story cave panel
import { SECTION } from './config.js';
import { state } from './state.js';
import { SHAPES, ANIMS, placeShape, samplesAlong, withArticle } from './sketches.js';
import { bounds, copies, invalidate, isCut } from './paint.js';
import { zoneAt, zoneFromId, photoImage } from './world.js';

export const ideaKey = (zone, idea) => `${zone.id}:${idea.id}`;
export const isDone = (zone, idea) => state.ideas.has(ideaKey(zone, idea));

const TRACED = 0.8;     // share of a dotted drawing that must be traced
const UNCOVERED = 0.5;  // share of a hidden picture that must be drawn over
const INK = '#7d776b';

let version = 0;        // bumps whenever the strokes change, so cached progress knows it is stale
export const strokesChanged = () => { version++; };

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

// ---------- Geometry and animation ----------

function makeAnim(kind, box, pivot, phase) {
  const A = ANIMS[kind];
  const px = box.x + box.w / 2, py = pivot === 'base' ? box.y + box.h : pivot === 'top' ? box.y : box.y + box.h / 2;
  return {
    reach: A.reach + 12,
    // translate(pivot + offset) · rotate · scale · translate(-pivot), as a canvas matrix.
    matrix(now) {
      const [dx, dy, turn, sx, sy] = A.at(now, phase), c = Math.cos(turn), s = Math.sin(turn);
      const a = c * sx, b = s * sx, cc = -s * sy, d = c * sy;
      return [a, b, cc, d, px + dx - (a * px + cc * py), py + dy - (b * px + d * py)];
    },
  };
}

const geoms = new Map();
export function geom(zone, idea) {
  const key = ideaKey(zone, idea);
  let g = geoms.get(key);
  if (g) return g;
  const ox = zone.col * SECTION, oy = zone.row * SECTION;
  g = { key, v: -1, p: 0 };
  if (idea.type === 'trace') {
    g.lines = placeShape(idea.shape, ox + idea.x, oy + idea.y, idea.s || 1, idea.flip);
    g.sampleLines = g.lines.map((l) => samplesAlong([l]));
    g.samples = g.sampleLines.flat();
    const xs = g.samples.map((p) => p[0]), ys = g.samples.map((p) => p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    g.box = { x: x0 - 10, y: y0 - 10, w: Math.max(...xs) - x0 + 20, h: Math.max(...ys) - y0 + 20 };
  } else g.box = { x: ox + idea.x, y: oy + idea.y, w: idea.w, h: idea.h };
  const anim = idea.anim ?? (idea.type === 'trace' ? SHAPES[idea.shape].anim : null);
  if (anim && ANIMS[anim]) g.anim = makeAnim(anim, g.box, idea.pivot ?? SHAPES[idea.shape]?.pivot, (hash(key) % 628) / 100);
  geoms.set(key, g);
  return g;
}

// ---------- Progress ----------

function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
  const k = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - ax - dx * k, py - ay - dy * k);
}
function touches(stroke, x, y, r) {
  for (const pts of copies(stroke)) {
    if (pts.length === 1 && Math.hypot(pts[0][0] - x, pts[0][1] - y) <= r) return true;
    for (let i = 1; i < pts.length; i++) if (distToSegment(x, y, pts[i - 1], pts[i]) <= r) return true;
  }
  return false;
}

function linesNear(box) {
  const out = [];
  state.strokes.forEach((s, i) => {
    if (s.kind === 'line' && !s.erase && !isCut(i) && overlaps(bounds(s), box)) out.push(s);
  });
  return out;
}

// How far along an idea is, from 0 to 1 (and beyond). Cached until the strokes change.
export function progress(zone, idea) {
  const g = geom(zone, idea);
  if (g.v === version) return g.p;
  g.v = version;
  const near = linesNear(g.box), box = g.box;
  if (idea.type === 'trace') {
    g.covered = g.samples.map(([x, y]) => near.some((s) => touches(s, x, y, s.size / 2 + 9)));
    g.p = g.covered.filter(Boolean).length / g.samples.length / TRACED;
  } else if (idea.type === 'hidden') {
    const cell = Math.max(box.w, box.h) / 14, cols = Math.ceil(box.w / cell), rows = Math.ceil(box.h / cell);
    const hit = new Uint8Array(cols * rows);
    for (const s of near) {
      const r = s.size / 2 + cell * 0.35, k = Math.ceil(r / cell);
      for (const pts of copies(s))
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[i];
          const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (cell / 2)));
          for (let j = 1; j <= steps; j++) {
            const x = ax + ((bx - ax) * j) / steps, y = ay + ((by - ay) * j) / steps;
            const cx = Math.floor((x - box.x) / cell), cy = Math.floor((y - box.y) / cell);
            for (let gy = cy - k; gy <= cy + k; gy++)
              for (let gx = cx - k; gx <= cx + k; gx++) {
                if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue;
                if (Math.hypot(box.x + (gx + 0.5) * cell - x, box.y + (gy + 0.5) * cell - y) <= r) hit[gy * cols + gx] = 1;
              }
          }
        }
    }
    g.p = hit.reduce((a, b) => a + b, 0) / hit.length / UNCOVERED;
  } else {
    let ink = 0;
    const inside = (x, y) => x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h;
    for (const s of near) {
      const weight = Math.max(1, s.size / 7);
      for (const pts of copies(s)) {
        if (pts.length === 1 && inside(...pts[0])) ink += s.size * 2;
        for (let i = 1; i < pts.length; i++) {
          const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
          if (inside((ax + bx) / 2, (ay + by) / 2)) ink += Math.hypot(bx - ax, by - ay) * weight;
        }
      }
    }
    g.p = ink / (idea.need || 260);
  }
  return g.p;
}

// Story panels open one at a time; everything else is always open.
export const isOpen = (zone, idea) => idea.story == null ||
  zone.ideas.every((o) => o.story == null || o.story >= idea.story || isDone(zone, o));

// Ideas finished by this stroke, as [zone, idea] pairs.
export function checkIdeas(stroke) {
  const b = bounds(stroke), done = [];
  for (let row = Math.floor(b.y / SECTION); row <= Math.floor((b.y + b.h) / SECTION); row++)
    for (let col = Math.floor(b.x / SECTION); col <= Math.floor((b.x + b.w) / SECTION); col++) {
      const zone = zoneAt(col, row);
      for (const idea of zone.ideas || []) {
        if (isDone(zone, idea) || !isOpen(zone, idea) || !overlaps(geom(zone, idea).box, b)) continue;
        if (progress(zone, idea) >= 1) {
          state.ideas.add(ideaKey(zone, idea));
          geom(zone, idea).doneAt = performance.now();
          done.push([zone, idea]);
        }
      }
    }
  if (done.length) assignAnims();
  return done;
}

export function lookup(key) {
  const cut = key.lastIndexOf(':');
  const zone = zoneFromId(key.slice(0, cut));
  const idea = zone?.ideas?.find((i) => i.id === key.slice(cut + 1));
  return idea ? [zone, idea] : [null, null];
}

// Lines inside a finished, moving idea come alive. Lines drawn there later join in too.
export function assignAnims() {
  const alive = [];
  for (const key of state.ideas) {
    const [zone, idea] = lookup(key);
    if (zone) {
      const g = geom(zone, idea);
      if (g.anim) alive.push(g);
    }
  }
  for (const s of state.strokes) {
    let anim = null;
    if (s.kind === 'line' && !s.erase && alive.length) {
      const b = bounds(s), cx = b.x + b.w / 2, cy = b.y + b.h / 2, m = 14;
      const g = alive.find(({ box }) => cx > box.x - m && cx < box.x + box.w + m && cy > box.y - m && cy < box.y + box.h + m &&
        b.w * b.h <= box.w * box.h * 3);
      anim = g?.anim || null;
    }
    if ((s._anim || null) !== anim) {
      s._anim = anim;
      invalidate(bounds(s));
    }
  }
}

// ---------- Words ----------
// Only the story cave has words: its captions are the story itself.

export function storyLine(zone, idea) {
  const word = state.words[ideaKey(zone, idea)];
  const fill = word ? withArticle(word) : isDone(zone, idea) ? 'something' : 'a ____';
  return idea.text.replace('{a}', fill).replace('{w}', word || (isDone(zone, idea) ? 'something' : '____'));
}

// The closest unfinished idea to a point, searching the sections around it.
export function nearestIdea(x, y, reach = 2) {
  let best = null;
  const c0 = Math.floor(x / SECTION), r0 = Math.floor(y / SECTION);
  for (let row = r0 - reach; row <= r0 + reach; row++)
    for (let col = c0 - reach; col <= c0 + reach; col++) {
      const zone = zoneAt(col, row);
      for (const idea of zone.ideas || []) {
        if (isDone(zone, idea) || !isOpen(zone, idea)) continue;
        const { box } = geom(zone, idea), d = Math.hypot(box.x + box.w / 2 - x, box.y + box.h / 2 - y);
        if (!best || d < best.d) best = { zone, idea, box, d };
      }
    }
  return best;
}

// ---------- The parade ----------
// Every finished drawing that moves, grouped, so the parade can carry them down the road.

let parade = { v: -1, n: -1, groups: [] };
export function paradeGroups() {
  if (parade.v === version && parade.n === state.ideas.size) return parade.groups;
  const groups = [];
  for (const key of state.ideas) {
    const [zone, idea] = lookup(key);
    const anim = zone && geom(zone, idea).anim;
    if (!anim) continue;
    const strokes = state.strokes.filter((s, i) => s._anim === anim && !isCut(i));
    if (!strokes.length) continue;
    const bs = strokes.map(bounds), x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y));
    const x1 = Math.max(...bs.map((b) => b.x + b.w)), y1 = Math.max(...bs.map((b) => b.y + b.h));
    groups.push({ strokes, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } });
  }
  parade = { v: version, n: state.ideas.size, groups };
  return groups;
}

// ---------- Drawing ----------
// Hints are pictures, never words: dots to trace, a dashed space with a pencil, a scribble mark.

function wrap(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  return line ? [...lines, line] : lines;
}

function writeText(ctx, text, x, y, width, { size = 16, color = INK, alpha = 1 } = {}) {
  ctx.save();
  ctx.font = `italic ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  wrap(ctx, text, width).forEach((l, i) => ctx.fillText(l, x, y + i * size * 1.25));
  ctx.restore();
}

function dashedBox(ctx, { x, y, w, h }, t, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([8, 7]);
  ctx.lineDashOffset = -t / 90;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.stroke();
  ctx.restore();
}

// A little pencil in the corner of a blank space, nodding as if it is about to draw.
function pencil(ctx, x, y, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(-0.7 + Math.sin(t / 500) * 0.12);
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#fffdf8';
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.rect(-3.5, -16, 7, 18);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3.5, 2);
  ctx.lineTo(0, 9);
  ctx.lineTo(3.5, 2);
  ctx.stroke();
  ctx.restore();
}

// A scribble that draws itself over and over: something is under here.
function scribbleMark(ctx, cx, cy, t, alpha) {
  const k = (t / 1400) % 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 40 * k; i++) {
    const x = cx - 22 + i * 1.1, y = cy + Math.sin(i * 0.9) * 10;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

// Draws dotted outlines, blank spaces, hidden-picture marks and story captions.
export function drawIdeas(ctx, sections, view, t) {
  for (const s of sections) {
    const zone = s.zone;
    for (const idea of zone?.ideas || []) {
      const g = geom(zone, idea), box = g.box;
      if (!overlaps(box, { x: view.x - 200, y: view.y - 100, w: view.w + 400, h: view.h + 200 })) continue;
      const done = isDone(zone, idea);
      if (idea.story != null) {
        const open = isOpen(zone, idea);
        if (!done) dashedBox(ctx, box, t, open ? 1 : 0.3);
        if (open || done) writeText(ctx, storyLine(zone, idea), box.x + box.w / 2, box.y + box.h + 20, box.w + 40, { color: done ? '#292824' : INK });
        continue;
      }
      if (done) continue;
      const p = progress(zone, idea);
      if (idea.type === 'trace') {
        // A faint guide line, with dots shimmering along whatever is still to trace.
        ctx.save();
        ctx.strokeStyle = INK;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 1;
        ctx.lineJoin = ctx.lineCap = 'round';
        ctx.beginPath();
        for (const line of g.lines) line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        ctx.fillStyle = INK;
        let n = 0;
        for (const line of g.sampleLines)
          for (const [x, y] of line) {
            if (!g.covered[n]) {
              ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t / 260 - n * 0.45);
              ctx.beginPath();
              ctx.arc(x, y, 2.3, 0, Math.PI * 2);
              ctx.fill();
            }
            n++;
          }
        ctx.restore();
      } else if (idea.type === 'space') {
        dashedBox(ctx, box, t);
        pencil(ctx, box.x + 18, box.y + 22, t, p > 0.1 ? 0.3 : 0.8);
      } else if (idea.type === 'hidden') {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = INK;
        ctx.setLineDash([2, 6]);
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(box.x, box.y, box.w, box.h, 18);
        ctx.stroke();
        ctx.restore();
        if (p < 0.05) scribbleMark(ctx, box.x + box.w / 2, box.y + box.h / 2, t, 0.45);
      }
    }
  }
}

// Hidden pictures on screen: where the visitor has drawn, the picture shows through.
export function hiddenOnScreen(sections, view) {
  const out = [];
  for (const s of sections)
    for (const idea of s.zone?.ideas || []) {
      if (idea.type !== 'hidden') continue;
      const g = geom(s.zone, idea);
      if (!overlaps(g.box, view)) continue;
      const img = photoImage(idea.photo);
      if (img) out.push({ box: g.box, img, done: isDone(s.zone, idea), since: g.doneAt ? performance.now() - g.doneAt : Infinity });
    }
  return out;
}

// Where a picture sits inside its box: as large as fits, centred.
export function fitInside(img, box) {
  const k = Math.min(box.w / img.width, box.h / img.height), w = img.width * k, h = img.height * k;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}
