// Building blocks for the endless outskirts. Every builder takes a random source and
// draws something a little different each time, so no two sections come out alike.
import { GROUND } from '../config.js';
import { path, rect, circle, ellipse, label, fill, TONE } from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };
const f = (n) => Math.round(n * 10) / 10;

export const pickFrom = (r, list) => list[Math.floor(r() * list.length)];
export const between = (r, a, b) => a + r() * (b - a);

// ---------- Words ----------

const ADJ = ['Velvet', 'Crooked', 'Sleepy', 'Paper', 'Brass', 'Lucky', 'Hollow', 'Tangled', 'Quiet', 'Copper', 'Upside', 'Golden', 'Mossy', 'Nimble', 'Rusty', 'Little', 'Honest', 'Wandering', 'Borrowed', 'Starlit'];
const NOUN = ['Spoon', 'Kettle', 'Thimble', 'Lantern', 'Pebble', 'Teacup', 'Button', 'Fern', 'Compass', 'Pigeon', 'Ladder', 'Biscuit', 'Moth', 'Ribbon', 'Anchor', 'Acorn', 'Sock', 'Whistle', 'Bramble', 'Puddle'];
const WAY = ['Lane', 'Row', 'Yard', 'Street', 'Walk', 'Corner', 'Steps', 'Crescent', 'Alley', 'Green'];
const TRADE = ['Hats', 'Buttons', 'Clocks', 'Cakes', 'Maps', 'Kites', 'Umbrellas', 'Records', 'Seeds', 'Soap', 'Socks', 'Bread', 'Postcards', 'Teapots', 'String'];
const FIRST = ['Ada', 'Ben', 'Cleo', 'Dot', 'Ezra', 'Fen', 'Gus', 'Hattie', 'Ivo', 'June', 'Kit', 'Lou', 'Milo', 'Nell', 'Otto', 'Pim', 'Rosa', 'Sol', 'Tilly', 'Wren'];
const LINES = [
  'I came out here to find the edge of the world. It keeps moving.',
  'Somebody painted my front door last week. Was that you?',
  'Out here the streets draw themselves while nobody is looking.',
  'I collect lost colours. So far: none. Business is slow.',
  'If you go far enough west, they say, it is all teacups.',
  'My grandmother lived three streets that way. The streets moved.',
  'Have you seen a cat with one stripe? No? Good. It owes me money.',
  'I am waiting for the bus. It has been a while. It might be a drawing.',
  'Paint something here and I will remember it. I remember everything.',
  'Every street out here is different. I checked. Twice.',
  'The pigeons around here are very opinionated.',
  'Mind the puddles. Some of them are deeper than they look.',
  'I like it out here. Nobody has decided what anything is yet.',
  'One day I will paint my house. Today I will think about it.',
];

export const placeName = (r) => `${pickFrom(r, ADJ)} ${pickFrom(r, NOUN)} ${pickFrom(r, WAY)}`;
export const personName = (r) => pickFrom(r, FIRST);
export const someLines = (r) => {
  const a = pickFrom(r, LINES);
  let b = pickFrom(r, LINES);
  if (b === a) b = LINES[(LINES.indexOf(a) + 3) % LINES.length];
  return [a, b];
};

// ---------- Street buildings: each returns { art, washes, chimneys } ----------

function windows(r, x, y, w, h, rows, cols) {
  let s = '';
  const kind = pickFrom(r, ['square', 'arched', 'round', 'shutter']);
  const gw = w / cols, gh = h / rows, ww = Math.min(gw * 0.56, 46), wh = Math.min(gh * 0.62, 60);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const cx = x + gw * (j + 0.5), cy = y + gh * (i + 0.5);
    if (r() < 0.08) continue;   // a bricked-up window here and there
    if (kind === 'round') s += circle(f(cx), f(cy), f(Math.min(ww, wh) / 2), fill.white) + path(`M${f(cx - ww / 2.4)} ${f(cy)} H${f(cx + ww / 2.4)}`, thin);
    else if (kind === 'arched') s += path(`M${f(cx - ww / 2)} ${f(cy + wh / 2)} V${f(cy - wh / 4)} A${f(ww / 2)} ${f(ww / 2)} 0 0 1 ${f(cx + ww / 2)} ${f(cy - wh / 4)} V${f(cy + wh / 2)} Z`, fill.white) + path(`M${f(cx)} ${f(cy - wh / 2)} V${f(cy + wh / 2)}`, thin);
    else {
      s += rect(f(cx - ww / 2), f(cy - wh / 2), f(ww), f(wh), fill.white) + path(`M${f(cx)} ${f(cy - wh / 2)} V${f(cy + wh / 2)} M${f(cx - ww / 2)} ${f(cy)} H${f(cx + ww / 2)}`, thin);
      if (kind === 'shutter') s += rect(f(cx - ww / 2 - 9), f(cy - wh / 2), 8, f(wh), fill.hatch) + rect(f(cx + ww / 2 + 1), f(cy - wh / 2), 8, f(wh), fill.hatch);
    }
    if (r() < 0.15) s += path(`M${f(cx - ww / 2)} ${f(cy + wh / 2)} h${f(ww)} v6 h${f(-ww)} Z`, fill.white) + path(`M${f(cx - 8)} ${f(cy + wh / 2)} q-4 -14 4 -16 M${f(cx + 6)} ${f(cy + wh / 2)} q4 -12 -2 -16`, thin);
  }
  return s;
}

function roof(r, x, w, top) {
  const kind = pickFrom(r, ['gable', 'flat', 'mansard', 'dome', 'saw']);
  let s = '', peak = top, chimney = null;
  if (kind === 'gable') {
    peak = top - between(r, 50, 110);
    s += path(`M${f(x - 10)} ${top} L${f(x + w / 2)} ${f(peak)} L${f(x + w + 10)} ${top} Z`, r() < 0.5 ? fill.cross : fill.hatch);
  } else if (kind === 'mansard') {
    peak = top - 50;
    s += path(`M${x - 6} ${top} L${x + 14} ${peak} H${x + w - 14} L${x + w + 6} ${top} Z`, fill.hatch);
  } else if (kind === 'dome') {
    peak = top - w / 2.6;
    s += path(`M${x} ${top} Q${f(x + w / 2)} ${f(top - w / 1.3)} ${x + w} ${top} Z`, fill.cross) + circle(f(x + w / 2), f(peak - 8), 5, fill.white);
  } else if (kind === 'saw') {
    const n = Math.max(2, Math.round(w / 60));
    let d = `M${x} ${top}`;
    for (let i = 0; i < n; i++) d += ` L${f(x + (w / n) * i)} ${top - 34} L${f(x + (w / n) * (i + 1))} ${top}`;
    s += path(d + ' Z', fill.hatch);
    peak = top - 34;
  } else s += rect(x - 6, top - 10, w + 12, 10, fill.white);
  if (r() < 0.75) {
    const cx = f(x + between(r, 0.18, 0.75) * w), ch = between(r, 30, 60);
    chimney = [cx + 9, f(Math.min(peak + 20, top) - ch)];
    s = rect(cx, f(Math.min(peak + 20, top) - ch), 18, f(ch + 10), fill.cross) + s;
  }
  return { art: s, peak, chimney };
}

export function townhouse(r, x, w) {
  const floors = 2 + Math.floor(r() * 3), fh = between(r, 86, 112), top = f(GROUND - floors * fh);
  const front = pickFrom(r, [fill.white, fill.light, fill.dots]);
  let s = rect(x, top, w, f(GROUND - top), front) + path(`M${x} ${GROUND} V${top} H${x + w} V${GROUND}`, { 'stroke-width': 2.2 });
  if (front === fill.light && r() < 0.6) for (let y = top + 14; y < GROUND; y += 16) s += path(`M${x + 2} ${f(y)} H${x + w - 2}`, light);
  s += windows(r, x + 10, top + 10, w - 20, floors * fh - fh - 10, floors - 1, Math.max(1, Math.round(w / 70)));
  // Ground floor: a door, maybe a step and a lamp.
  const dx = f(x + between(r, 0.2, 0.7) * w);
  s += path(`M${dx} ${GROUND} V${GROUND - 64} Q${dx + 18} ${GROUND - 80} ${dx + 36} ${GROUND - 64} V${GROUND}`, fill.white) + circle(dx + 28, GROUND - 32, 2, fill.ink);
  if (r() < 0.5) s += windows(r, x + 6, GROUND - fh + 10, Math.max(40, dx - x - 12), fh - 30, 1, 1);
  const rf = roof(r, x, w, top);
  return { art: rf.art + s, chimneys: rf.chimney ? [rf.chimney] : [], washes: [[`M${x} ${top} H${x + w} V${GROUND} H${x} Z`, 0.22]] };
}

export function shop(r, x, w) {
  const top = f(GROUND - between(r, 190, 260)), sign = `${pickFrom(r, ADJ).toUpperCase()} ${pickFrom(r, TRADE).toUpperCase()}`;
  let s = rect(x, top, w, f(GROUND - top), fill.white) + path(`M${x} ${GROUND} V${top} H${x + w} V${GROUND}`, { 'stroke-width': 2.2 });
  s += windows(r, x + 10, top + 8, w - 20, 70, 1, Math.max(1, Math.round(w / 80)));
  const sy = f(top + 92);
  s += rect(x + 6, sy, w - 12, 24, fill.white) + label(f(x + w / 2), sy + 17, sign.length * 8 > w - 20 ? sign.split(' ')[1] : sign, { size: 10, anchor: 'middle', spacing: 2 });
  // Awning: scalloped or straight, striped.
  const ay = sy + 30, scallop = r() < 0.5;
  s += rect(x - 4, ay, w + 8, 22, fill.white);
  for (let i = x - 4; i < x + w + 4; i += 24) s += rect(i, ay, 12, 22, fill.hatch);
  if (scallop) s += path(`M${x - 4} ${ay + 22} ` + `a${f((w + 8) / Math.round((w + 8) / 24) / 2)} 8 0 0 0 ${f((w + 8) / Math.round((w + 8) / 24))} 0 `.repeat(Math.round((w + 8) / 24)), fill.white);
  // Shop window with things for sale.
  const wy = ay + 40, wx = x + 10, ww = w * 0.6;
  s += rect(wx, wy, f(ww), f(GROUND - wy - 20), fill.white);
  const goods = pickFrom(r, ['cakes', 'hats', 'books', 'bottles', 'clocks']);
  for (let i = 0; i < Math.floor(ww / 34); i++) {
    const gx = wx + 18 + i * 34, gy = GROUND - 26;
    if (goods === 'cakes') s += path(`M${gx - 12} ${gy} h24 v-12 q-12 -12 -24 0 Z M${gx} ${gy - 18} v-6`, fill.white);
    if (goods === 'hats') s += path(`M${gx - 14} ${gy - 6} h28 M${gx - 8} ${gy - 6} v-18 h16 v18`, fill.white);
    if (goods === 'books') s += rect(gx - 8, gy - 28 + (i % 3) * 4, 14, 28 - (i % 3) * 4, i % 2 ? fill.hatch : fill.white);
    if (goods === 'bottles') s += path(`M${gx - 7} ${gy} v-20 q0 -6 5 -8 v-8 h4 v8 q5 2 5 8 v20 Z`, fill.white);
    if (goods === 'clocks') s += circle(gx, gy - 14, 11, fill.white) + path(`M${gx} ${gy - 14} v-7 M${gx} ${gy - 14} h5`, thin);
  }
  const dx = f(x + w * 0.72);
  s += rect(dx, wy, f(w * 0.22), f(GROUND - wy), fill.white) + circle(dx + 6, f(wy + (GROUND - wy) / 2), 2, fill.ink);
  return { art: s, chimneys: [], washes: [[`M${x - 4} ${ay} H${x + w + 4} V${ay + 22} H${x - 4} Z`, 0.5], [`M${x} ${top} H${x + w} V${GROUND} H${x} Z`, 0.15]] };
}

export function park(r, x, w) {
  let s = '';
  const washes = [];
  const n = Math.max(1, Math.round(w / 110));
  for (let i = 0; i < n; i++) {
    const tx = f(x + (w / n) * (i + 0.5) + between(r, -16, 16)), th = between(r, 130, 220), cw = between(r, 50, 80);
    s += path(`M${tx - 5} ${GROUND} Q${tx - 2} ${f(GROUND - th / 2)} ${tx} ${f(GROUND - th)} M${tx + 5} ${GROUND} Q${tx + 4} ${f(GROUND - th / 2)} ${tx + 2} ${f(GROUND - th)}`, { 'stroke-width': 1.8 });
    const cy = GROUND - th - cw * 0.4;
    let d = `M${f(tx - cw)} ${f(cy)}`;
    for (let k = 0; k < 7; k++) {
      const a0 = Math.PI + (k / 7) * Math.PI * 2, a1 = Math.PI + ((k + 1) / 7) * Math.PI * 2, rr = cw * between(r, 0.85, 1.1);
      d += ` Q${f(tx + Math.cos((a0 + a1) / 2) * rr * 1.35)} ${f(cy + Math.sin((a0 + a1) / 2) * rr * 1.1)} ${f(tx + Math.cos(a1) * rr)} ${f(cy + Math.sin(a1) * rr * 0.8)}`;
    }
    s += path(d + ' Z', r() < 0.3 ? fill.dots : fill.white);
    washes.push([d + ' Z', 0.45, 'moss']);
  }
  if (r() < 0.6) {
    const bx = f(x + between(r, 10, Math.max(12, w - 90)));
    s += path(`M${bx} ${GROUND - 24} h80 M${bx + 2} ${GROUND - 40} h76 M${bx + 6} ${GROUND - 24} v24 M${bx + 74} ${GROUND - 24} v24 M${bx + 6} ${GROUND - 40} v16 M${bx + 74} ${GROUND - 40} v16`, { 'stroke-width': 1.8 });
  }
  if (r() < 0.4) {
    const fx = f(x + w / 2);
    s += ellipse(fx, GROUND - 14, 46, 10, fill.white) + path(`M${fx - 46} ${GROUND - 14} V${GROUND} M${fx + 46} ${GROUND - 14} V${GROUND} M${fx} ${GROUND - 14} V${GROUND - 60}`, thin) + ellipse(fx, GROUND - 60, 14, 4, fill.white);
    washes.push([`M${fx - 46} ${GROUND - 24} H${fx + 46} V${GROUND - 4} H${fx - 46} Z`, 0.5, 'pond']);
  }
  return { art: s, chimneys: [], washes };
}

export function tower(r, x, w) {
  const tw = Math.min(w, between(r, 70, 110)), tx = x + (w - tw) / 2, top = f(GROUND - between(r, 330, 470));
  let s = rect(f(tx), top, f(tw), f(GROUND - top), fill.light);
  for (let y = top + 30; y < GROUND - 40; y += 60) s += path(`M${f(tx + tw / 2 - 8)} ${f(y)} v26 h16 v-26 Z`, fill.white);
  s += path(`M${f(tx - 8)} ${top} L${f(tx + tw / 2)} ${f(top - between(r, 70, 140))} L${f(tx + tw + 8)} ${top} Z`, fill.cross);
  if (r() < 0.6) s += circle(f(tx + tw / 2), f(top + 40), f(tw * 0.3), fill.white) + path(`M${f(tx + tw / 2)} ${f(top + 40)} l0 -${f(tw * 0.2)} M${f(tx + tw / 2)} ${f(top + 40)} l${f(tw * 0.15)} 0`, thin);
  return { art: s, chimneys: [], washes: [[`M${f(tx)} ${top} H${f(tx + tw)} V${GROUND} H${f(tx)} Z`, 0.25]] };
}

export function cottage(r, x, w) {
  const cw = Math.min(w - 20, between(r, 120, 180)), cx = x + 10, top = GROUND - between(r, 90, 120);
  let s = rect(cx, f(top), f(cw), f(GROUND - top), fill.white) + windows(r, cx + 8, top + 8, cw * 0.5, (GROUND - top) * 0.6, 1, 1);
  s += rect(f(cx + cw * 0.65), GROUND - 60, 30, 60, fill.white);
  const rf = roof(r, cx, cw, f(top));
  // A picket fence and some flowers.
  for (let px = x; px < x + w; px += 12) s += path(`M${px} ${GROUND} V${GROUND - 26} l3 -5 l3 5 V${GROUND}`, thin);
  s += path(`M${x} ${GROUND - 18} H${x + w}`, thin);
  for (let i = 0; i < 5; i++) s += circle(f(x + 10 + r() * (w - 20)), f(GROUND - 30 - r() * 12), 4, fill.white);
  return { art: rf.art + s, chimneys: rf.chimney ? [rf.chimney] : [], washes: [[`M${cx} ${f(top)} H${f(cx + cw)} V${GROUND} H${cx} Z`, 0.25]] };
}

// A person on the pavement, never quite the same twice.
export function person(r, x, y = GROUND) {
  const hat = pickFrom(r, ['none', 'cap', 'top', 'beret', 'bun']), skirt = r() < 0.5, h = between(r, 0.85, 1.1);
  let s = skirt ? path(`M${x - 12} ${f(y - 22 * h)} L${x - 8} ${f(y - 52 * h)} H${x + 8} L${x + 12} ${f(y - 22 * h)} Z`, pickFrom(r, [fill.hatch, fill.white, fill.dots])) : path(`M${x - 9} ${f(y - 54 * h)} H${x + 9} V${f(y - 28 * h)} H${x - 9} Z`, pickFrom(r, [fill.hatch, fill.white]));
  s += path(`M${x - 5} ${f(y - 24 * h)} V${y} M${x + 5} ${f(y - 24 * h)} V${y} M${x - 9} ${f(y - 50 * h)} l-8 18 M${x + 9} ${f(y - 50 * h)} l8 18`, thin);
  const hy = f(y - 64 * h);
  s += circle(x, hy, 9, fill.white) + path(`M${x - 3} ${hy} h1 M${x + 3} ${hy} h1`, thin);
  if (hat === 'cap') s += path(`M${x - 9} ${hy - 4} Q${x} ${hy - 16} ${x + 9} ${hy - 4} h6`, fill.ink);
  if (hat === 'top') s += rect(x - 7, hy - 22, 14, 14, fill.ink) + path(`M${x - 11} ${hy - 8} h22`, { 'stroke-width': 2 });
  if (hat === 'beret') s += ellipse(x + 2, hy - 8, 11, 4, fill.ink);
  if (hat === 'bun') s += circle(x, hy - 11, 5, fill.white);
  if (r() < 0.3) s += path(`M${x + 17} ${f(y - 32 * h)} v14 h10 v-14 Z`, fill.white);   // a bag
  return s;
}
