// The paint tin: a flood fill bounded by the artwork's ink and the visitor's own lines.
import { SECTION } from './config.js';
import { state } from './state.js';
import { boundaryArt, ensureSection } from './world.js';
import { bounds, drawLine } from './paint.js';

const MAX_SHARE = 0.6;   // refuse fills bigger than this share of a section: the shape is open
const SPREAD = 2;        // grow the fill under the ink so no paper shows at the edges

// Builds a wall map for one section: 1 where ink or a drawn line stops paint.
function walls(section, now) {
  const art = boundaryArt(section).getContext('2d').getImageData(0, 0, SECTION, SECTION).data;
  const lines = document.createElement('canvas');
  lines.width = lines.height = SECTION;
  const lc = lines.getContext('2d');
  lc.translate(-section.col * SECTION, -section.row * SECTION);
  const area = { x: section.col * SECTION, y: section.row * SECTION, w: SECTION, h: SECTION };
  for (const s of state.strokes) {
    if (s.kind !== 'line') continue;
    const b = bounds(s);
    if (b.x > area.x + area.w || b.y > area.y + area.h || b.x + b.w < area.x || b.y + b.h < area.y) continue;
    // Only the line itself is a wall: no leaves, wobble or glow.
    drawLine(lc, { ...s, fx: null, glow: false }, now);
  }
  const drawn = lc.getImageData(0, 0, SECTION, SECTION).data;
  const wall = new Uint8Array(SECTION * SECTION);
  for (let i = 0, p = 0; i < wall.length; i++, p += 4) {
    const lum = art[p] * 0.3 + art[p + 1] * 0.59 + art[p + 2] * 0.11;
    if (lum < 150 || drawn[p + 3] > 110) wall[i] = 1;
  }
  return wall;
}

function nearestOpen(wall, x, y) {
  for (let r = 0; r <= 5; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const px = x + dx, py = y + dy;
        if (px >= 0 && py >= 0 && px < SECTION && py < SECTION && !wall[py * SECTION + px]) return [px, py];
      }
  return null;
}

// Scanline flood fill. Returns the filled mask and its bounding box, or a reason it failed.
function flood(wall, sx, sy) {
  const mask = new Uint8Array(SECTION * SECTION);
  const stack = [[sx, sy]];
  const limit = SECTION * SECTION * MAX_SHARE;
  let count = 0, x0 = sx, x1 = sx, y0 = sy, y1 = sy;
  while (stack.length) {
    let [x, y] = stack.pop();
    let i = y * SECTION + x;
    while (x > 0 && !wall[i - 1] && !mask[i - 1]) { x--; i--; }
    let up = false, down = false;
    // A shape that reaches the edge of the section carries on into the next place: it is open.
    if (y === 0 || y === SECTION - 1 || x === 0) return { open: true };
    for (; x < SECTION && !wall[i] && !mask[i]; x++, i++) {
      if (x === SECTION - 1) return { open: true };
      mask[i] = 1;
      if (++count > limit) return { open: true };
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (y > 0) {
        const o = !wall[i - SECTION] && !mask[i - SECTION];
        if (o && !up) stack.push([x, y - 1]);
        up = o;
      }
      if (y < SECTION - 1) {
        const o = !wall[i + SECTION] && !mask[i + SECTION];
        if (o && !down) stack.push([x, y + 1]);
        down = o;
      }
    }
  }
  return { mask, count, box: { x0, y0, x1, y1 } };
}

export async function fillAt(wx, wy) {
  const col = Math.floor(wx / SECTION), row = Math.floor(wy / SECTION);
  const section = ensureSection(col, row);
  if (!section.art) return { error: 'This part is still unfolding.' };
  const now = Date.now();
  const wall = walls(section, now);
  const start = nearestOpen(wall, Math.floor(wx - col * SECTION), Math.floor(wy - row * SECTION));
  if (!start) return { error: 'Tap inside a shape, not on its outline.' };
  const result = flood(wall, start[0], start[1]);
  if (result.open) return { error: 'That space is open. Draw a line to close it, then fill.' };

  const { box } = result;
  const x = Math.max(0, box.x0 - SPREAD), y = Math.max(0, box.y0 - SPREAD);
  const w = Math.min(SECTION, box.x1 + SPREAD + 1) - x, h = Math.min(SECTION, box.y1 + SPREAD + 1) - y;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++) {
      let hit = false;
      for (let dy = -SPREAD; dy <= SPREAD && !hit; dy++)
        for (let dx = -SPREAD; dx <= SPREAD && !hit; dx++) {
          const sx = x + px + dx, sy = y + py + dy;
          if (sx >= 0 && sy >= 0 && sx < SECTION && sy < SECTION && result.mask[sy * SECTION + sx]) hit = true;
        }
      if (hit) img.data[(py * w + px) * 4 + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return {
    stroke: {
      kind: 'fill', color: state.color, pattern: state.pattern,
      x: col * SECTION + x, y: row * SECTION + y, w, h,
      area: result.count, mask: c.toDataURL('image/png'),
    },
    // The original point, so secrets can test "was this filled?"
    contains: (px, py) => {
      const lx = Math.floor(px - col * SECTION), ly = Math.floor(py - row * SECTION);
      return lx >= 0 && ly >= 0 && lx < SECTION && ly < SECTION && result.mask[ly * SECTION + lx] === 1;
    },
  };
}
