// Zones on the world grid, plus the per-section image cache the renderer draws from.
import { SECTION } from './config.js';
import { state, markDirty } from './state.js';
import { sectionSVG } from './svg.js';
import { ZONES } from './zones/index.js';
import { outskirtsZone } from './zones/outskirts.js';

const cellKey = (col, row) => `${col},${row}`;
const byCell = new Map(ZONES.map((z) => [cellKey(z.col, z.row), z]));
const generated = new Map();   // outskirts, built on first visit and kept

// Every cell of the world is a place: hand-made if there is one, otherwise generated.
export function zoneAt(col, row) {
  const k = cellKey(col, row);
  if (byCell.has(k)) return byCell.get(k);
  if (!generated.has(k)) generated.set(k, outskirtsZone(col, row));
  return generated.get(k);
}
export const zoneById = (id) => ZONES.find((z) => z.id === id) || [...generated.values()].find((z) => z.id === id) || null;
export const knownZones = () => [...ZONES, ...generated.values()];
export const zoneAtPoint = (x, y) => zoneAt(Math.floor(x / SECTION), Math.floor(y / SECTION));
export const secretId = (zone, secret) => `${zone.id}:${secret.id}`;
export const zones = ZONES;

// Finds and residents in world coordinates, for picking and drawing.
export function worldFinds(zone) {
  return zone.finds.map((f) => ({ ...f, wx: zone.col * SECTION + f.x, wy: zone.row * SECTION + f.y }));
}
export function findVisible(zone, find) {
  if (state.found.has(find.id)) return false;
  return !find.hidden || state.secrets.has(`${zone.id}:${find.hidden}`);
}

function imageFromSVG(svg) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Artwork failed to load')); };
    img.src = url;
  });
}

const sections = new Map();
let loading = 0;
export const isLoading = () => loading > 0;

export function ensureSection(col, row) {
  const k = cellKey(col, row);
  let s = sections.get(k);
  if (!s) {
    s = { col, row, k, zone: zoneAt(col, row), art: null, wash: null, reveal: null, revealSig: '', raster: null, res: 0 };
    sections.set(k, s);
    loadSection(s);
  }
  return s;
}
export const getSection = (col, row) => sections.get(cellKey(col, row)) || null;

async function loadSection(s) {
  loading++;
  try {
    s.art = await imageFromSVG(s.zone.art());
    if (s.zone?.wash) {
      const img = await imageFromSVG(s.zone.wash());
      const c = document.createElement('canvas');
      c.width = c.height = SECTION / 2;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      s.wash = c;
    }
    await refreshReveal(s);
  } catch (err) {
    console.error(err);
    sections.delete(s.k);
  } finally {
    loading--;
    markDirty();
  }
}

// Secrets that have been painted add their artwork on top of the zone.
export async function refreshReveal(s) {
  const zone = s.zone;
  if (!zone) return;
  const open = zone.secrets.filter((x) => state.secrets.has(secretId(zone, x)));
  const sig = open.map((x) => x.id).join();
  if (sig === s.revealSig) return;
  s.revealSig = sig;
  s.reveal = sig ? await imageFromSVG(sectionSVG(open.map((x) => x.reveal()).join(''))) : null;
  s.raster = null;
  s.photoSig = undefined;   // a secret may uncover a hidden photo
  markDirty();
}
export const refreshAllReveals = () => Promise.all([...sections.values()].map(refreshReveal));

// The artwork, rasterised at the current zoom so lines stay crisp.
export function raster(s, res) {
  if (!s.art) return null;
  if (s.raster && s.res === res) return s.raster;
  const c = document.createElement('canvas');
  c.width = c.height = Math.round(SECTION * res);
  const ctx = c.getContext('2d');
  ctx.drawImage(s.art, 0, 0, c.width, c.height);
  if (s.reveal) ctx.drawImage(s.reveal, 0, 0, c.width, c.height);
  s.raster = c;
  s.res = res;
  return c;
}

// A 1:1 picture of the artwork on white, which the paint tin reads walls from.
export function boundaryArt(s) {
  const c = document.createElement('canvas');
  c.width = c.height = SECTION;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SECTION, SECTION);
  if (s.art) ctx.drawImage(s.art, 0, 0);
  if (s.reveal) ctx.drawImage(s.reveal, 0, 0);
  return c;
}

// ---------- Photo collage ----------
// Zones list photos as { src, x, y, h or w, rotate, tape, hidden }. They are drawn greyscale
// and blended into the paper; as the zone warms up they slowly regain their colour.

const photos = new Map();   // src -> { img, grey } once loaded, or a pending promise

function loadPhoto(src) {
  if (!photos.has(src)) {
    photos.set(src, new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const grey = document.createElement('canvas');
        grey.width = img.width;
        grey.height = img.height;
        const g = grey.getContext('2d');
        g.drawImage(img, 0, 0);
        const data = g.getImageData(0, 0, grey.width, grey.height);
        const d = data.data;
        for (let i = 0; i < d.length; i += 4) {
          const l = Math.min(255, (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) * 1.04);
          d[i] = d[i + 1] = d[i + 2] = l;
        }
        g.putImageData(data, 0, 0);
        const done = { img, grey };
        photos.set(src, done);
        resolve(done);
      };
      img.onerror = () => reject(new Error(`Photo ${src} failed to load`));
      img.src = `photos/${src}.webp`;
    }));
  }
  return photos.get(src);
}

// A strip of masking tape, sized to the photo it holds.
function tape(ctx, x, y, angle, size) {
  const half = Math.max(10, Math.min(24, size * 0.2)), t = half * 0.3;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(234,226,203,0.82)';
  ctx.beginPath();
  ctx.moveTo(-half, -t);
  ctx.lineTo(half, -t);
  for (let i = 0; i <= 4; i++) ctx.lineTo(half + (i % 2 ? 2 : 0), -t + (i * t) / 2);
  ctx.lineTo(-half, t);
  for (let i = 0; i <= 4; i++) ctx.lineTo(-half - (i % 2 ? 2 : 0), t - (i * t) / 2);
  ctx.fill();
  ctx.restore();
}

const openPhotos = (zone) => (zone?.photos || []).filter((p) => !p.hidden || state.secrets.has(`${zone.id}:${p.hidden}`));

// Builds the greyscale and colour collage layers for a section once its photos are loaded.
function buildPhotos(s) {
  const list = openPhotos(s.zone);
  const sig = list.map((p) => p.src).join();
  if (s.photoSig === sig) return;
  const loaded = list.map((p) => loadPhoto(p.src));
  if (loaded.some((p) => p instanceof Promise)) {
    Promise.allSettled(loaded).then(markDirty);
    return;
  }
  const layers = [0, 1].map(() => {
    const c = document.createElement('canvas');
    c.width = c.height = SECTION;
    return c;
  });
  s.photoBoxes = [];
  list.forEach((p, i) => {
    const { img } = loaded[i];
    const h = p.h ?? (p.w * img.height) / img.width, w = p.w ?? (h * img.width) / img.height;
    const turn = ((p.rotate ?? ((p.x * 7 + p.y * 3) % 9) - 4) * Math.PI) / 180;
    layers.forEach((layer, colour) => {
      const ctx = layer.getContext('2d');
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(turn);
      ctx.drawImage(colour ? img : loaded[i].grey, -w / 2, -h / 2, w, h);
      const inset = Math.min(10, w * 0.12);
      if (p.tape !== 0) tape(ctx, -w / 2 + inset, -h / 2 + inset * 0.6, -0.6, Math.min(w, h));
      if (p.tape === 2) tape(ctx, w / 2 - inset, -h / 2 + inset * 0.6, 0.6, Math.min(w, h));
      ctx.restore();
    });
    s.photoBoxes.push({ src: p.src, x: p.x - w / 2, y: p.y - h / 2, w, h });
  });
  [s.photoGrey, s.photoColour] = layers;
  s.photoMix = null;
  s.photoSig = sig;
}

// The collage at a given colourfulness: greyscale, with the colour version faded over it.
export function photoLayer(s, warmth) {
  if (!s.zone?.photos?.length) return null;
  buildPhotos(s);
  if (!s.photoGrey) return null;
  const mix = Math.round(Math.min(1, warmth * 1.6) * 20) / 20;
  if (mix === 0) return s.photoGrey;
  if (mix === 1) return s.photoColour;
  if (s.photoMix && s.photoMixLevel === mix) return s.photoMix;
  const c = s.photoMix || document.createElement('canvas');
  c.width = c.height = SECTION;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, SECTION, SECTION);
  ctx.drawImage(s.photoGrey, 0, 0);
  ctx.globalAlpha = mix;
  ctx.drawImage(s.photoColour, 0, 0);
  ctx.globalAlpha = 1;
  s.photoMix = c;
  s.photoMixLevel = mix;
  return c;
}

let credits = [];
export async function loadCredits() {
  try {
    credits = await (await fetch('photos/credits.json')).json();
  } catch {
    credits = [];
  }
  return credits;
}
export const allCredits = () => credits;

// The photo under a world point, with its credit.
export function photoAt(wx, wy) {
  const col = Math.floor(wx / SECTION), row = Math.floor(wy / SECTION);
  const s = getSection(col, row);
  const lx = wx - col * SECTION, ly = wy - row * SECTION;
  for (const b of [...(s?.photoBoxes || [])].reverse()) {
    if (lx >= b.x && lx <= b.x + b.w && ly >= b.y && ly <= b.y + b.h) return credits.find((c) => c.name === b.src) || { name: b.src, title: b.src };
  }
  return null;
}

// Keep nearby sections, forget rasters far away so memory stays small.
export function keepOnly(keys) {
  for (const [k, s] of sections) {
    if (keys.has(k)) continue;
    if (sections.size > 30) sections.delete(k);
    else {
      s.raster = null;
      s.photoGrey = s.photoColour = s.photoMix = null;
      s.photoSig = undefined;
    }
  }
}
