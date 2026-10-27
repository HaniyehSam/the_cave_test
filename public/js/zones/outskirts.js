// The endless outskirts: any section without a hand-made zone is assembled here from a
// seed, so it is always the same when you come back, and never the same as its neighbours.
import { COLORS, GROUND } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, label, fill, TONE, random, groundStrip, cloud, cave,
} from '../svg.js';
import { pickFrom, between, placeName, personName, someLines, townhouse, shop, park, tower, cottage, person } from './outskirts-parts.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };
const f = (n) => Math.round(n * 10) / 10;
const HUES = ['coral', 'marigold', 'teal', 'lavender', 'mint', 'blush', 'sand', 'pond', 'rust', 'plum'];
const POSTERS = ['apple-red', 'pear-green', 'cherries', 'lighthouse', 'montgolfier', 'pigeons', 'shell-plate', 'mushroom-chart', 'starfish', 'jellyfish', 'moon', 'locomotive', 'wild-turkey', 'pear-big'];

const seedOf = (col, row) => (Math.imul(col, 73856093) ^ Math.imul(row, 19349663) ^ 0x5bd1e995) >>> 0;

// ---------- The street level ----------

function street(r, col) {
  let art = groundStrip(r, { manhole: r() < 0.4 ? f(between(r, 100, 860)) : null, crossing: r() < 0.3 ? f(between(r, 100, 760)) : null, cobbles: r() < 0.25 });
  const washes = [], chimneys = [], spots = [];
  const builders = [townhouse, townhouse, shop, shop, park, tower, cottage];
  let x = f(between(r, 10, 50));
  while (x < 900) {
    const w = f(Math.min(between(r, 150, 300), 950 - x));
    if (w < 110) break;
    const b = pickFrom(r, builders)(r, x, w);
    art += b.art;
    chimneys.push(...b.chimneys);
    for (const [d, o, hue] of b.washes) washes.push(wash(d, COLORS[hue || pickFrom(r, HUES)].hex, o));
    spots.push([x, w]);
    x = f(x + w + between(r, 14, 60));
  }
  // Telephone wires between rooftops, sometimes with a shoe hanging off one.
  if (r() < 0.6) {
    const y = f(between(r, 260, 360));
    art += path(`M0 ${y} Q480 ${f(y + 40)} 960 ${y}`, thin);
    if (r() < 0.3) art += path(`M${f(between(r, 200, 700))} ${f(y + 30)} l0 18 l10 4 l-14 0 Z`, fill.white);
  }
  art = cloud(f(between(r, 20, 400)), f(between(r, 60, 160)), f(between(r, 90, 160)), r) + (r() < 0.6 ? cloud(f(between(r, 500, 800)), f(between(r, 40, 140)), f(between(r, 80, 140)), r) : '') + art;
  washes.unshift(wash('M0 0 H960 V700 H0 Z', COLORS.pond.hex, 0.12));
  // A neighbour standing on the pavement.
  const px = f(between(r, 60, 900));
  const residents = [{ id: 'local', name: personName(r), x: px, y: GROUND, w: 40, h: 76, lines: ((l) => () => l)(someLines(r)) }];
  art += person(r, px);
  // Now and then, a real photo pasted up as a poster.
  const photos = [];
  if (r() < 0.35 && spots.length) {
    const [sx, sw] = pickFrom(r, spots);
    photos.push({ src: pickFrom(r, POSTERS), x: f(sx + sw / 2), y: f(GROUND - between(r, 120, 200)), h: f(between(r, 70, 100)), tape: 2 });
  }
  return { art, washes, chimneys, residents, photos };
}

// ---------- The sky ----------

function sky(r, row) {
  let art = '';
  const washes = [wash('M0 0 H960 V960 H0 Z', COLORS[row < -1 ? 'midnight' : 'pond'].hex, row < -1 ? 0.2 : 0.12)];
  for (let i = 0; i < 3 + Math.floor(r() * 3); i++) art += cloud(f(between(r, 0, 820)), f(between(r, 60, 900)), f(between(r, 80, 180)), r);
  if (row < -1) for (let i = 0; i < 30; i++) {
    const x = f(r() * 960), y = f(r() * 960), k = f(between(r, 2, 5));
    art += path(`M${x} ${f(y - k)} v${f(2 * k)} M${f(x - k)} ${y} h${f(2 * k)}`, thin);
  }
  // A small floating island with a house on it.
  const ix = f(between(r, 140, 620)), iy = f(between(r, 420, 720)), iw = f(between(r, 200, 300));
  art += path(`M${ix} ${iy} Q${f(ix + iw / 2)} ${f(iy - 16)} ${f(ix + iw)} ${iy} L${f(ix + iw * 0.8)} ${f(iy + 60)} L${f(ix + iw * 0.55)} ${f(iy + 130)} L${f(ix + iw * 0.3)} ${f(iy + 70)} Z`, fill.hatch);
  const hx = f(ix + iw * 0.25), hw = f(iw * 0.45), hh = f(between(r, 60, 90));
  art += rect(hx, f(iy - hh - 4), hw, hh, fill.white) + path(`M${f(hx - 8)} ${f(iy - hh - 4)} L${f(hx + hw / 2)} ${f(iy - hh - 50)} L${f(hx + hw + 8)} ${f(iy - hh - 4)} Z`, fill.cross);
  art += rect(f(hx + hw / 2 - 10), f(iy - 40), 20, 36, fill.white);
  washes.push(wash(`M${hx} ${f(iy - hh - 4)} h${hw} v${hh} h${-hw} Z`, COLORS[pickFrom(r, HUES)].hex, 0.35));
  // Things that fly: a paper plane, a balloon, a kite.
  const flyer = pickFrom(r, ['plane', 'balloon', 'kite']), fx = f(between(r, 100, 820)), fy = f(between(r, 80, 300));
  if (flyer === 'plane') art += path(`M${fx} ${fy} l60 10 l-60 12 l12 -12 Z M${f(fx + 12)} ${f(fy + 10)} l48 0`, fill.white);
  if (flyer === 'balloon') art += ellipse(fx, fy, 30, 38, fill.white) + path(`M${f(fx - 26)} ${f(fy + 14)} L${f(fx - 10)} ${f(fy + 56)} M${f(fx + 26)} ${f(fy + 14)} L${f(fx + 10)} ${f(fy + 56)}`, thin) + rect(f(fx - 12), f(fy + 56), 24, 16, fill.hatch);
  if (flyer === 'kite') art += path(`M${fx} ${f(fy - 30)} l22 30 l-22 30 l-22 -30 Z`, fill.white) + path(`M${fx} ${f(fy + 30)} q-20 40 10 80`, thin);
  const residents = [{ id: 'islander', name: personName(r), x: f(hx + hw + 20), y: f(iy - 4), w: 40, h: 76, lines: ((l) => () => l)(someLines(r)) }];
  art += person(r, f(hx + hw + 20), f(iy - 4));
  return { art, washes, chimneys: [], residents, photos: [] };
}

// ---------- Underground ----------

function underground(r, row) {
  const top = f(between(r, 140, 260)), bottom = f(between(r, 860, 920));
  const fillPath = `M0 640 H40 Q20 ${f(top + 160)} 160 ${top} Q480 ${f(top - 80)} 800 ${top} Q940 ${f(top + 160)} 920 640 H960 V760 H920 Q900 ${bottom} 480 ${bottom} Q60 ${bottom} 40 760 H0 Z`;
  const outline = `M0 640 H40 Q20 ${f(top + 160)} 160 ${top} Q480 ${f(top - 80)} 800 ${top} Q940 ${f(top + 160)} 920 640 H960 M960 760 H920 Q900 ${bottom} 480 ${bottom} Q60 ${bottom} 40 760 H0`;
  let art = cave(fillPath, outline, r);
  const washes = [wash(fillPath, COLORS[row > 1 ? 'plum' : 'sand'].hex, 0.18)];
  const floor = f(bottom - 40);
  art += path(`M80 ${floor} H880`, { 'stroke-width': 1.8 });
  const things = [];
  for (let i = 0; i < 4; i++) things.push(pickFrom(r, ['crystals', 'fossil', 'cart', 'chest', 'pipes', 'mushrooms', 'bones']));
  things.forEach((t, i) => {
    const x = f(140 + i * 200 + between(r, -40, 40)), y = floor;
    if (t === 'crystals') {
      for (let k = 0; k < 4; k++) art += path(`M${f(x + k * 14 - 20)} ${y} l-6 -${f(between(r, 30, 70))} l12 -10 l8 10 l-4 ${f(between(r, 30, 70))} Z`, fill.white);
      washes.push(wash(`M${f(x - 40)} ${f(y - 90)} h100 v90 h-100 Z`, COLORS[pickFrom(r, ['lavender', 'mint', 'pond'])].hex, 0.5));
    }
    if (t === 'fossil') {
      let d = `M${x} ${f(y - 40)}`;
      for (let a = 0; a < Math.PI * 5; a += 0.3) d += ` L${f(x + Math.cos(a) * a * 3)} ${f(y - 40 + Math.sin(a) * a * 3)}`;
      art += circle(x, f(y - 40), 32, fill.light) + path(d, thin);
    }
    if (t === 'cart') art += path(`M${f(x - 40)} ${y - 14} L${f(x - 34)} ${y - 54} H${f(x + 34)} L${f(x + 40)} ${y - 14} Z`, fill.hatch) + circle(f(x - 22), y - 8, 8, fill.white) + circle(f(x + 22), y - 8, 8, fill.white) + path(`M${f(x - 80)} ${y} H${f(x + 80)}`, { 'stroke-width': 2 });
    if (t === 'chest') art += rect(f(x - 30), y - 40, 60, 40, fill.white) + path(`M${f(x - 30)} ${y - 40} Q${x} ${y - 64} ${f(x + 30)} ${y - 40} M${f(x - 30)} ${y - 26} H${f(x + 30)}`, fill.white) + rect(x - 5, y - 32, 10, 10, fill.ink);
    if (t === 'pipes') art += path(`M${x} ${top} V${f(y - 60)} H${f(x + 60)} V${y} M${f(x + 12)} ${top} V${f(y - 72)} H${f(x + 72)} V${y}`, { 'stroke-width': 2 }) + circle(x + 6, f(y - 66), 8, fill.white);
    if (t === 'mushrooms') for (let k = 0; k < 3; k++) { const mx = f(x + k * 22 - 22), mr = f(between(r, 8, 16)); art += path(`M${mx - 3} ${y} V${f(y - mr)} M${mx + 3} ${y} V${f(y - mr)} M${f(mx - mr)} ${f(y - mr)} Q${mx} ${f(y - mr * 2.4)} ${f(mx + mr)} ${f(y - mr)} Z`, fill.white); }
    if (t === 'bones') art += path(`M${f(x - 40)} ${y - 10} H${f(x + 40)} M${f(x - 30)} ${y - 10} v-16 M${f(x - 10)} ${y - 10} v-22 M${f(x + 10)} ${y - 10} v-22 M${f(x + 30)} ${y - 10} v-16`, thin) + circle(f(x + 48), y - 16, 10, fill.white);
  });
  const mx = f(between(r, 120, 840));
  const residents = [{ id: 'digger', name: personName(r), x: mx, y: floor, w: 40, h: 76, lines: ((l) => () => l)(someLines(r)) }];
  art += person(r, mx, floor);
  return { art, washes, chimneys: [], residents, photos: [] };
}

// ---------- Life ----------

function makeAlive(chimneys, row) {
  return (ctx, t, { warmth }) => {
    if (warmth > 0.2) for (const [cx, cy] of chimneys) for (let i = 0; i < 3; i++) {
      const k = (t / 2400 + i / 3) % 1;
      ctx.strokeStyle = `rgba(41,40,36,${0.4 * (1 - k)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx + k * 24, cy - k * 90, 4 + k * 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (warmth > 0.4 && row <= 0) {   // a bird or two crossing
      ctx.strokeStyle = '#292824';
      ctx.lineWidth = 1.4;
      const x = (t / 25) % 1100 - 70, y = 180 + Math.sin(t / 800) * 30, w = Math.sin(t / 150) * 4;
      ctx.beginPath();
      ctx.moveTo(x - 9, y - w);
      ctx.quadraticCurveTo(x - 4, y - 6, x, y);
      ctx.quadraticCurveTo(x + 4, y - 6, x + 9, y - w);
      ctx.stroke();
    }
  };
}

export function outskirtsZone(col, row) {
  const r = random(seedOf(col, row));
  const name = row === 0 ? placeName(r) : row < 0 ? `${placeName(r).split(' ').slice(0, 2).join(' ')} Heights` : `${placeName(r).split(' ').slice(0, 2).join(' ')} Hollow`;
  const built = row === 0 ? street(r, col) : row < 0 ? sky(r, row) : underground(r, row);
  return {
    id: `out:${col},${row}`,
    name,
    col,
    row,
    generated: true,
    art: () => sectionSVG(built.art),
    wash: () => washSVG(built.washes.join('')),
    alive: makeAlive(built.chimneys, row),
    photos: built.photos,
    finds: [],
    secrets: [],
    residents: built.residents,
  };
}
