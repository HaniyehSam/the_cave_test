// The Root Cellar: under the greenhouse, where the roots come through the ceiling.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, label, fill, TONE, random, cave,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

const CAVE = 'M0 640 H40 Q20 360 140 220 Q300 120 520 140 Q780 150 880 300 Q940 440 920 640 H960 V760 H920 Q900 900 480 908 Q70 900 40 760 H0 Z';
const EDGE = 'M0 640 H40 Q20 360 140 220 Q300 120 520 140 Q780 150 880 300 Q940 440 920 640 H960 M960 760 H920 Q900 900 480 908 Q70 900 40 760 H0';
const MUSHROOMS = [[420, 860, 22], [452, 864, 15], [478, 862, 18], [396, 866, 12]];

function roots() {
  // Roots of the greenhouse plants, hanging through the ceiling.
  let s = '';
  for (const [x, len] of [[180, 140], [260, 90], [330, 200], [480, 120], [600, 170], [700, 110], [790, 150]]) {
    s += path(`M${x} 150 Q${x - 14} ${150 + len / 2} ${x + 6} ${150 + len} M${x - 4} ${150 + len * 0.4} q-16 10 -18 26 M${x + 2} ${150 + len * 0.7} q14 6 16 22`, thin);
  }
  return s;
}

function stores() {
  let s = path('M60 860 H900', { 'stroke-width': 2 });
  // Shelves for jars on the left wall.
  s += path('M90 610 H360 M90 760 H360 M100 610 V860 M350 610 V860', { 'stroke-width': 2 });
  for (const [x, h] of [[120, 50], [150, 40], [180, 56], [300, 46], [330, 36]]) s += path(`M${x - 12} 760 V${760 - h} Q${x} ${756 - h} ${x + 12} ${760 - h} V760 Z`, fill.white) + rect(x - 13, 760 - h - 6, 26, 6, fill.hatch);
  // A bunch of beetroot hanging from a hook.
  s += path('M640 150 V280', thin);
  for (const [dx, dy] of [[-14, 18], [0, 30], [14, 16], [-4, 44]]) s += circle(640 + dx, 290 + dy, 11, fill.hatch) + path(`M${640 + dx} ${279 + dy} l-4 -14 M${640 + dx} ${279 + dy} l5 -12`, thin);
  // Barrels and sacks.
  for (const x of [720, 820]) s += path(`M${x - 40} 860 Q${x - 48} 800 ${x - 40} 740 H${x + 40} Q${x + 48} 800 ${x + 40} 860 Z`, fill.white) + path(`M${x - 44} 770 H${x + 44} M${x - 44} 830 H${x + 44}`, { 'stroke-width': 2 });
  s += path('M560 860 Q550 800 576 790 L590 776 L604 790 Q630 800 620 860 Z', fill.dots) + label(568, 840, 'SPUDS', { size: 8 });
  // Glowing mushrooms, not glowing yet.
  for (const [x, y, r] of MUSHROOMS) s += path(`M${x - 4} ${y} V${y - r * 0.7} M${x + 4} ${y} V${y - r * 0.7} M${x - r} ${y - r * 0.7} Q${x} ${y - r * 2} ${x + r} ${y - r * 0.7} Z`, fill.white);
  // Mrs Delve the mole and her lantern.
  s += path('M866 860 Q860 800 880 790 Q906 780 914 820 L918 860 Z', fill.hatch) + ellipse(872, 796, 18, 12, fill.hatch);
  s += path('M856 796 l-10 2 l10 4', fill.ink) + circle(866, 790, 1.6, fill.white);
  s += path('M852 820 L836 806 M836 806 V790', thin) + path('M828 790 H844 V774 H828 Z M832 774 q4 -8 8 0', fill.white);
  return s;
}

const art = () => {
  const r = random(1111);
  return sectionSVG(cave(CAVE, EDGE, r) + roots() + stores());
};

const colourWash = () => washSVG(
  wash(CAVE, COLORS.sand.hex, 0.2) +
  wash('M610 280 a32 32 0 1 0 64 0 a32 32 0 1 0 -64 0 Z M610 330 a32 32 0 1 0 64 0 a32 32 0 1 0 -64 0 Z', COLORS.beet.hex, 0.5) +
  wash('M680 740 H860 V860 H680 Z', COLORS.rust.hex, 0.35) +
  wash('M90 610 H360 V860 H90 Z', COLORS.moss.hex, 0.15),
);

const glow = () => path('M436 816 l6 -10 M406 830 l-6 -10', thin);

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.1) {      // drips from the roots
    for (let i = 0; i < 4; i++) {
      const x = [180, 330, 600, 790][i], k = ((t / 1800 + i * 0.37) % 1);
      ctx.fillStyle = 'rgba(95,168,211,0.6)';
      ctx.beginPath();
      ctx.ellipse(x + 6, 300 + k * 540, 2, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Mrs Delve's lantern always flickers a little.
  const f = 0.6 + Math.sin(t / 120) * 0.15;
  ctx.fillStyle = `rgba(240,180,41,${f})`;
  ctx.fillRect(830, 776, 12, 12);
  if (has('mushrooms')) {
    for (const [i, [x, y, r]] of MUSHROOMS.entries()) {
      const k = 0.6 + Math.sin(t / 700 + i) * 0.3;
      const g = ctx.createRadialGradient(x, y - r, 2, x, y - r, r * 3);
      g.addColorStop(0, `rgba(143,211,182,${0.55 * k})`);
      g.addColorStop(1, 'rgba(143,211,182,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y - r, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default {
  id: 'cellar',
  name: 'The Root Cellar',
  col: -1,
  row: 1,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'storage-jar', x: 236, y: 568, h: 76, rotate: -2, tape: 0 },
    { src: 'bottle', x: 250, y: 716, h: 86, rotate: 3, tape: 0 },
    { src: 'mushroom-chart', x: 480, y: 420, h: 170, rotate: -2, tape: 2 },
  ],
  finds: [{ id: 'color:beet', x: 680, y: 330, clue: 'hanging from the ceiling' }],
  secrets: [{ id: 'mushrooms', x: 436, y: 852, r: 40, amount: 50, reveal: glow, say: 'The mushrooms glow softly.' }],
  residents: [
    {
      id: 'delve', name: 'Mrs Delve', x: 884, y: 860, w: 60, h: 80,
      lines: ({ has }) => has('mushrooms')
        ? ['Oh, they glow again! I can put my lantern down for once.', 'That chart on the wall says which ones are safe. I have never trusted it.']
        : ['Mind the roots, dear. The greenhouse is just over our heads.', 'Those little mushrooms used to glow. Lit the whole cellar.'],
    },
  ],
};
