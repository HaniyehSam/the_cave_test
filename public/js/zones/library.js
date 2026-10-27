// The Sunken Library: down the manhole from Paper Street, a cave full of books.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, label, fill, TONE, random, cave,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

// The cave, with a shaft up to the manhole on Paper Street (x 300) and tunnels east and west.
const CAVE = 'M0 640 H44 Q30 420 110 280 Q190 180 280 176 V0 H320 V170 Q600 130 820 220 Q930 320 916 640 H960 V760 H916 Q900 900 480 912 Q76 902 44 760 H0 Z';
const EDGE = 'M0 640 H44 Q30 420 110 280 Q190 180 280 176 V0 M320 0 V170 Q600 130 820 220 Q930 320 916 640 H960 M960 760 H916 Q900 900 480 912 Q76 902 44 760 H0';

function shelves(x, w, top) {
  let s = rect(x, top, w, 860 - top, fill.hatch) + rect(x + 8, top + 8, w - 16, 852 - top - 8, fill.white);
  for (let y = top + 78; y < 860; y += 78) {
    s += rect(x + 8, y, w - 16, 6, fill.light);
    let bx = x + 12;
    while (bx < x + w - 24) {
      const bw = 8 + ((bx * 7 + y) % 9), bh = 40 + ((bx * 13 + y) % 30), lean = (bx + y) % 11 === 0;
      s += lean ? path(`M${bx} ${y} L${bx + 14} ${y - bh + 4} L${bx + 14 + bw} ${y - bh + 6} L${bx + bw} ${y} Z`, fill.white) : rect(bx, y - bh, bw, bh, (bx + y) % 3 ? fill.white : fill.light);
      bx += bw + (lean ? 18 : 2);
    }
  }
  return s;
}

function room() {
  let s = path('M70 860 H890', { 'stroke-width': 2 });
  for (let x = 90; x < 890; x += 60) s += path(`M${x} 860 v12`, light);
  // Ladder rungs in the shaft from the street.
  for (let y = 16; y < 180; y += 22) s += path(`M286 ${y} H314`, thin);
  s += shelves(90, 200, 300) + shelves(640, 200, 300);
  // A spiral staircase winding up into the dark.
  s += path('M360 860 V250', { 'stroke-width': 2.4 });
  for (let i = 0; i < 14; i++) {
    const y = 840 - i * 42, dir = i % 2 ? 1 : -1;
    s += path(`M360 ${y} L${360 + dir * 52} ${y - 10} L${360 + dir * 52} ${y - 4} L360 ${y + 6} Z`, fill.white);
  }
  // Reading desk and a lectern.
  s += rect(462, 800, 166, 10, fill.white) + path('M472 810 V860 M618 810 V860', { 'stroke-width': 2 });
  s += path('M700 860 V820 M680 860 h40 M672 818 L728 806', { 'stroke-width': 2 });
  // A puddle with a paper boat in it.
  s += ellipse(220, 866, 70, 8, fill.light) + path('M196 862 H236 L228 854 H204 Z M216 854 V836 L230 852', fill.white);
  // The Librarian: a bookworm in spectacles, coming out of a very large book.
  s += path('M396 860 L404 836 H472 L480 860 Z', fill.hatch) + path('M438 836 V858', thin);
  s += path('M430 838 Q426 806 444 796 Q462 788 466 806', { 'stroke-width': 9, stroke: '#292824' }) + path('M430 838 Q426 806 444 796 Q462 788 466 806', { 'stroke-width': 6.5, stroke: '#fffdf8' });
  s += circle(462, 800, 5) + circle(474, 802, 5) + path('M467 801 h2', thin);
  return s;
}

const art = () => {
  const r = random(1001);
  return sectionSVG(cave(CAVE, EDGE, r) + room());
};

const colourWash = () => washSVG(
  wash(CAVE, COLORS.sepia.hex, 0.25) +
  wash('M90 300 H290 V860 H90 Z M640 300 H840 V860 H640 Z', COLORS.rust.hex, 0.25) +
  wash('M400 640 a100 100 0 1 0 200 0 a100 100 0 1 0 -200 0 Z', COLORS.marigold.hex, 0.4) +
  wash('M150 866 a70 8 0 1 0 140 0 a70 8 0 1 0 -140 0 Z', COLORS.pond.hex, 0.5),
);

const flame = () => path('M500 606 q-8 -14 0 -26 q8 12 0 26 Z', fill.white);

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.2) {      // loose pages drifting through the air
    for (let i = 0; i < 4; i++) {
      const k = (t / 9000 + i / 4) % 1, x = 120 + ((i * 210 + k * 500) % 700), y = 260 + Math.sin(k * 6 + i) * 60 + i * 50;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t / 900 + i) * 0.5);
      ctx.fillStyle = '#fffdf8';
      ctx.strokeStyle = '#292824';
      ctx.lineWidth = 1;
      ctx.fillRect(-10, -13, 20, 26);
      ctx.strokeRect(-10, -13, 20, 26);
      ctx.strokeStyle = '#b9b4a8';
      for (let l = -7; l < 10; l += 4) {
        ctx.beginPath();
        ctx.moveTo(-6, l);
        ctx.lineTo(6, l);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  if (has('candle')) {     // candlelight and drifting fireflies
    const flicker = 0.8 + Math.sin(t / 90) * 0.1 + Math.sin(t / 37) * 0.05;
    const g = ctx.createRadialGradient(500, 600, 4, 500, 600, 160 * flicker);
    g.addColorStop(0, 'rgba(240,180,41,0.45)');
    g.addColorStop(1, 'rgba(240,180,41,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(500, 600, 160, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = t / (1800 + i * 200) + i;
      ctx.fillStyle = `rgba(240,180,41,${0.5 + Math.sin(t / 200 + i) * 0.4})`;
      ctx.beginPath();
      ctx.arc(480 + Math.cos(a) * (120 + i * 20), 560 + Math.sin(a * 1.3) * 120, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default {
  id: 'library',
  name: 'The Sunken Library',
  col: 0,
  row: 1,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'candlestick', x: 500, y: 704, h: 194, rotate: 0, tape: 0 },
    { src: 'inkwell', x: 590, y: 776, h: 46, rotate: 2, tape: 0 },
    { src: 'old-book', x: 700, y: 790, h: 54, rotate: -10, tape: 0 },
  ],
  finds: [
    { id: 'color:sepia', x: 640, y: 780, clue: 'next to the inkwell' },
    { id: 'mod:glow', x: 430, y: 820, hidden: 'candle', clue: 'it is too dark to read' },
  ],
  secrets: [{ id: 'candle', x: 500, y: 616, r: 24, amount: 25, reveal: flame, say: 'The candle catches, and fireflies come to see.' }],
  residents: [
    {
      id: 'worm', name: 'The Librarian', x: 450, y: 840, w: 60, h: 60,
      lines: ({ has }) => has('candle')
        ? ['Light! Now I can finally finish chapter four hundred.', 'The fireflies like you. Take a jar of them.']
        : ['Shh. This is a library. Even underground.', 'The candle went out. Nobody can read a thing.', 'You came down the manhole? Everybody does, eventually.'],
    },
  ],
};
