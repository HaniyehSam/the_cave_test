// What painting does to the world: warming zones, revealing secrets, collecting finds.
import { SECTION, findInfo, STARTING_FINDS } from './config.js';
import { state, markDirty, homeCamera } from './state.js';
import { zones, knownZones, zoneAtPoint, worldFinds, findVisible, secretId, ensureSection, refreshReveal, photoAt } from './world.js';
import { bounds, copies, indexStroke, reindex, loadFill } from './paint.js';
import { save } from './store.js';

// The UI fills these in, so this module never imports the DOM layer.
export const hooks = { toast() {}, changed() {}, bubble() {} };

const WARM_TARGET = 6500;     // paint needed to bring a zone fully alive
const FILL_CAP = 280;         // one fill, however big, only counts this much
const SECRET_WARMTH = 0.12;   // each discovered secret warms its zone a little too

// ---------- Warmth ----------

function paintAmounts(stroke, add) {
  if (stroke.erase) return;
  if (stroke.kind === 'fill') {
    const z = zoneAtPoint(stroke.x + stroke.w / 2, stroke.y + stroke.h / 2);
    if (z) add(z.id, Math.min(FILL_CAP, 40 + stroke.area / 60));
    return;
  }
  const weight = Math.min(3, Math.max(0.5, stroke.size / 7));
  for (const pts of copies(stroke))
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const z = zoneAtPoint((ax + bx) / 2, (ay + by) / 2);
      if (z) add(z.id, Math.hypot(bx - ax, by - ay) * weight);
    }
}

export function recomputeWarmth() {
  const raw = {};
  const add = (id, v) => { raw[id] = (raw[id] || 0) + v; };
  state.strokes.forEach((s) => paintAmounts(s, add));
  const warmth = {};
  for (const z of knownZones()) {
    const secrets = z.secrets.filter((x) => state.secrets.has(secretId(z, x))).length;
    warmth[z.id] = Math.min(1, (raw[z.id] || 0) / WARM_TARGET + secrets * SECRET_WARMTH);
  }
  const before = state.warmth;
  state.warmth = warmth;
  markDirty();
  return before;
}

function announceWarmth(before) {
  for (const z of knownZones()) {
    const was = before[z.id] || 0, now = state.warmth[z.id] || 0;
    if (was < 0.35 && now >= 0.35) hooks.toast(`${z.name} is waking up…`);
    else if (was < 1 && now >= 1) hooks.toast(`${z.name} is fully alive!`);
  }
}

// ---------- Secrets ----------

function lengthNear(stroke, cx, cy, r) {
  let total = 0;
  for (const pts of copies(stroke)) {
    if (pts.length === 1 && Math.hypot(pts[0][0] - cx, pts[0][1] - cy) < r) total += stroke.size;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      if (Math.hypot((ax + bx) / 2 - cx, (ay + by) / 2 - cy) < r) total += Math.hypot(bx - ax, by - ay);
    }
  }
  return total * Math.max(1, stroke.size / 7);
}

function checkSecrets(stroke, contains) {
  const b = bounds(stroke);
  for (const zone of zones) {
    const ox = zone.col * SECTION, oy = zone.row * SECTION;
    for (const secret of zone.secrets) {
      const id = secretId(zone, secret);
      if (state.secrets.has(id)) continue;
      if (secret.color && stroke.color !== secret.color) continue;
      const cx = ox + secret.x, cy = oy + secret.y, r = secret.r || 30;
      if (cx < b.x - r || cy < b.y - r || cx > b.x + b.w + r || cy > b.y + b.h + r) continue;
      let hit = false;
      if (stroke.kind === 'fill') hit = !!contains?.(cx, cy);
      else if (!stroke.erase && lengthNear(stroke, cx, cy, r) > 0) {
        const total = state.strokes.filter((s) => s.kind === 'line' && !s.erase && (!secret.color || s.color === secret.color))
          .reduce((sum, s) => sum + lengthNear(s, cx, cy, r), 0);
        hit = total >= (secret.amount || 45);
      }
      if (!hit) continue;
      state.secrets.add(id);
      refreshReveal(ensureSection(zone.col, zone.row));
      const appeared = zone.finds.some((f) => f.hidden === secret.id && !state.found.has(f.id));
      hooks.toast(secret.say + (appeared ? ' Something new appeared.' : ''));
    }
  }
}

// ---------- Strokes ----------

export function commit(stroke, contains) {
  state.strokes.push(stroke);
  state.redo = [];
  indexStroke(stroke, state.strokes.length - 1);
  checkSecrets(stroke, contains);
  announceWarmth(recomputeWarmth());
  hooks.changed();
  save();
}

export function undo() {
  state.active = null;
  if (!state.strokes.length) return;
  state.redo.push(state.strokes.pop());
  reindex();
  recomputeWarmth();
  hooks.changed();
  save();
}

export function redo() {
  if (!state.redo.length) return;
  const s = state.redo.pop();
  state.strokes.push(s);
  indexStroke(s, state.strokes.length - 1);
  recomputeWarmth();
  hooks.changed();
  save();
}

// ---------- Picking things up and talking ----------

export function collect(id) {
  if (state.found.has(id)) return;
  const info = findInfo(id);
  state.found.add(id);
  state.fresh.add(id);
  if (info.kind === 'color') {
    state.color = info.key;
    if (state.tool === 'eraser') state.tool = 'pencil';
  }
  const lead = { color: 'You found', pattern: 'A new pattern:', tool: 'You found the', mod: 'Magic!' }[info.kind];
  hooks.toast(`${lead} ${info.name}${info.kind === 'color' ? ' paint' : ''}. ${info.hint || ''}`.trim());
  hooks.changed();
  markDirty();
  save();
}

// Returns true if the tap landed on a find or a resident (or, when asked, a photo).
export function pick(wx, wy, radius, { photos = false } = {}) {
  for (const zone of zones) {
    for (const f of worldFinds(zone)) {
      if (findVisible(zone, f) && Math.hypot(f.wx - wx, f.wy - wy) < radius) {
        collect(f.id);
        return true;
      }
    }
  }
  const zone = zoneAtPoint(wx, wy);
  if (!zone) return false;
  const lx = wx - zone.col * SECTION, ly = wy - zone.row * SECTION;
  for (const r of zone.residents) {
    if (Math.abs(lx - r.x) < (r.w || 50) / 2 && ly < r.y + 8 && ly > r.y - (r.h || 80)) {
      talk(zone, r);
      return true;
    }
  }
  const photo = photos && photoAt(wx, wy);
  if (photo) {
    hooks.toast(`${photo.title}${photo.source ? ` · ${photo.source}, ${photo.licence}` : ''}`, 5000);
    return true;
  }
  return false;
}

export function talk(zone, resident) {
  const has = (id) => state.secrets.has(`${zone.id}:${id}`);
  const lines = resident.lines({ warmth: state.warmth[zone.id] || 0, has });
  const key = `${zone.id}:${resident.id}`;
  const n = state.talked[key] || 0;
  state.talked[key] = n + 1;
  hooks.bubble({
    name: resident.name,
    text: lines[n % lines.length],
    wx: zone.col * SECTION + resident.x,
    wy: zone.row * SECTION + resident.y - (resident.h || 80),
  });
  save();
}

export async function loadPainting(strokes) {
  await Promise.all(strokes.filter((s) => s.kind === 'fill').map(loadFill));
  reindex();
  recomputeWarmth();
  for (const [id, v] of Object.entries(state.warmth)) state.shownWarmth[id] = v;
}

export function resetAll() {
  state.strokes = [];
  state.redo = [];
  state.active = null;
  state.found = new Set(STARTING_FINDS);
  state.fresh = new Set();
  state.secrets = new Set();
  state.talked = {};
  state.visited = new Set();
  state.tool = 'pencil';
  state.color = 'ink';
  state.pattern = 'solid';
  state.size = 7;
  for (const k of Object.keys(state.mods)) state.mods[k] = false;
  state.camera = homeCamera();
  state.shownWarmth = {};
  reindex();
  recomputeWarmth();
  zones.forEach((z) => refreshReveal(ensureSection(z.col, z.row)));
  hooks.changed();
  return save(true);
}
