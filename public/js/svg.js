// Helpers for writing zone artwork as SVG strings.
//
// Layering rule for artists: anything darker than about #999 is a wall for the
// paint tin, anything lighter is decoration that paint flows over. Paint is
// multiplied on top of the artwork, so ink lines always stay visible.
import { SECTION, PAPER, INK, GROUND } from './config.js';

export const TONE = {
  paper: PAPER,
  white: '#fffdf8',
  light: '#efece4',
  mid: '#e2ded3',
  shade: '#d3cfc3',
  hatch: '#b9b4a8',
  ink: INK,
};

const attrs = (a) => Object.entries(a).map(([k, v]) => (v == null || v === false ? '' : ` ${k}="${v}"`)).join('');

export const path = (d, a = {}) => `<path d="${d}"${attrs(a)}/>`;
export const rect = (x, y, w, h, a = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${attrs(a)}/>`;
export const circle = (cx, cy, r, a = {}) => `<circle cx="${cx}" cy="${cy}" r="${r}"${attrs(a)}/>`;
export const ellipse = (cx, cy, rx, ry, a = {}) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${attrs(a)}/>`;
export const line = (x1, y1, x2, y2, a = {}) => path(`M${x1} ${y1} L${x2} ${y2}`, a);
export const g = (content, a = {}) => `<g${attrs(a)}>${content}</g>`;

export function at(x, y, content, { scale = 1, rotate = 0, flip = false } = {}) {
  const sx = flip ? -scale : scale;
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${sx} ${scale})">${content}</g>`;
}

const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

export function label(x, y, text, { size = 11, anchor = 'start', spacing = 1.6, serif = false, rotate = 0, fill = INK } = {}) {
  const family = serif ? 'Georgia, serif' : 'ui-monospace, monospace';
  const turn = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : '';
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}" stroke="none"${turn}>${escape(text)}</text>`;
}

// Fill styles for shading. Hatch tones stay light so they never block the paint tin.
export const fill = {
  white: { fill: TONE.white },
  paper: { fill: TONE.paper },
  light: { fill: TONE.light },
  mid: { fill: TONE.mid },
  shade: { fill: TONE.shade },
  ink: { fill: INK },
  hatch: { fill: 'url(#hatch)' },
  cross: { fill: 'url(#cross)' },
  dots: { fill: 'url(#stipple)' },
  none: { fill: 'none' },
};

const DEFS = `<defs>
  <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
    <rect width="7" height="7" fill="${TONE.white}"/><path d="M0 0 V7" stroke="${TONE.hatch}" stroke-width="1"/>
  </pattern>
  <pattern id="cross" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
    <rect width="7" height="7" fill="${TONE.light}"/><path d="M0 0 V7 M0 0 H7" stroke="${TONE.hatch}" stroke-width="1"/>
  </pattern>
  <pattern id="stipple" width="9" height="9" patternUnits="userSpaceOnUse">
    <rect width="9" height="9" fill="${TONE.white}"/><circle cx="2" cy="2" r=".8" fill="${TONE.hatch}"/><circle cx="6.5" cy="6.5" r=".8" fill="${TONE.hatch}"/>
  </pattern>
  <filter id="wash" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/>
    <feDisplacementMap in="SourceGraphic" scale="14"/>
    <feGaussianBlur stdDeviation="5"/>
  </filter>
</defs>`;

// A complete, transparent-background section document with the house line style.
export function sectionSVG(content, { stroke = INK, width = 1.6 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SECTION}" height="${SECTION}" viewBox="0 0 ${SECTION} ${SECTION}">${DEFS}<g fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${content}</g></svg>`;
}

// Soft watercolour patches that fade in as a zone warms up.
export function washSVG(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SECTION}" height="${SECTION}" viewBox="0 0 ${SECTION} ${SECTION}">${DEFS}<g filter="url(#wash)" stroke="none">${content}</g></svg>`;
}
export const wash = (d, color, opacity = 0.45) => path(d, { fill: color, opacity });

// Deterministic randomness, so a section always draws the same way.
export function random(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// A slightly hand-drawn line through points: each segment bows a little.
export function sketch(points, rnd, wobble = 1.6, close = false) {
  const pts = close ? [...points, points[0]] : points;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2 + (rnd() - 0.5) * wobble * 2, my = (y0 + y1) / 2 + (rnd() - 0.5) * wobble * 2;
    d += ` Q${mx.toFixed(1)} ${my.toFixed(1)} ${x1} ${y1}`;
  }
  return close ? d + ' Z' : d;
}
export const sketchRect = (x, y, w, h, rnd, wobble) => sketch([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], rnd, wobble, true);

// Pavement, kerb, road and the soil beneath: identical edges in every street section,
// so neighbouring zones always meet cleanly.
export function groundStrip(rnd, { crossing = null, manhole = null, cobbles = false } = {}) {
  const bare = { stroke: 'none' };
  let s = rect(0, GROUND, SECTION, 22, { ...fill.light, ...bare }) + rect(0, GROUND + 22, SECTION, 128, { ...fill.white, ...bare });
  s += path(`M0 ${GROUND} H${SECTION}`, { 'stroke-width': 2.4 });
  s += path(`M0 ${GROUND + 22} H${SECTION}`, { 'stroke-width': 2 });
  for (let x = 24; x < SECTION; x += 48) s += path(`M${x} ${GROUND} l-5 22`, { 'stroke-width': 0.8 });
  if (cobbles) {
    for (let y = GROUND + 34; y < GROUND + 140; y += 16)
      for (let x = (y / 16) % 2 ? 0 : 12; x < SECTION; x += 26) s += ellipse(x, y, 10, 5, { stroke: TONE.hatch, 'stroke-width': 0.8 });
  } else {
    for (let x = 20; x < SECTION; x += 80) s += path(`M${x} ${GROUND + 86} h38`, { 'stroke-width': 2.2 });
  }
  if (crossing != null) for (let i = 0; i < 6; i++) s += rect(crossing + i * 22, GROUND + 30, 12, 112, { fill: TONE.white, 'stroke-width': 1.2 });
  if (manhole != null) s += ellipse(manhole, GROUND + 110, 30, 9, fill.hatch) + ellipse(manhole, GROUND + 110, 22, 6);
  s += path(`M0 ${GROUND + 150} H${SECTION}`, { 'stroke-width': 2.4 });
  // Soil, with roots and pebbles that later lead underground.
  s += rect(0, GROUND + 150, SECTION, SECTION - GROUND - 150, { ...fill.dots, ...bare });
  for (let i = 0; i < 14; i++) {
    const x = rnd() * SECTION, y = GROUND + 175 + rnd() * 70;
    s += ellipse(x.toFixed(0), y.toFixed(0), (4 + rnd() * 7).toFixed(1), (3 + rnd() * 3).toFixed(1), fill.white);
  }
  return s;
}

// Underground zones: soil everywhere, with a cave carved out of it. `outline` is an open
// path so the cave's tunnels can run off the section edge (y 640–760) into the next cave.
export function cave(fillPath, outline, rnd) {
  let s = rect(0, 0, SECTION, SECTION, { fill: 'url(#stipple)', stroke: 'none' });
  for (let i = 0; i < 18; i++) {
    const x = rnd() * SECTION, y = rnd() * SECTION;
    s += ellipse(x.toFixed(0), y.toFixed(0), (4 + rnd() * 8).toFixed(1), (3 + rnd() * 4).toFixed(1), fill.white);
  }
  return s + path(fillPath, { fill: TONE.white, stroke: 'none' }) + path(outline, { 'stroke-width': 2.6 });
}
export const TUNNEL = { top: 640, bottom: 760 };

// Clouds drawn as one loose outline; used sparingly with different shapes.
export function cloud(x, y, w, rnd) {
  const bumps = 3 + Math.floor(rnd() * 3), step = w / bumps;
  let d = `M${x} ${y}`;
  for (let i = 0; i < bumps; i++) {
    // Middle puffs are taller than the ones at the ends.
    const r = step * (0.55 + (i > 0 && i < bumps - 1 ? 0.25 + rnd() * 0.2 : rnd() * 0.1));
    d += ` a${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${step.toFixed(1)} 0`;
  }
  return path(d + ` q${(-w / 2).toFixed(1)} 12 ${-w} 0 Z`, fill.white);
}
