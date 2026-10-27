// The Cabinet of Curiosities: one enormous cabinet of real museum objects, an owl who
// looks after them, and a prism under glass.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, label, fill, TONE, random, groundStrip, cloud,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };
const SHELVES = [392, 486, 580, 674];

const tag = (x, y, text) => path(`M${x} ${y} l-10 -14`, thin) + rect(x - 34, y - 26, 30, 13, fill.white) + label(x - 31, y - 16, text, { size: 7, spacing: 0.5 });

function building(r) {
  let s = cloud(120, 110, 140, r) + cloud(700, 70, 120, r);
  // Museum hall with a pediment; the front wall has been lifted away.
  s += path('M40 254 L480 120 L920 254 Z', fill.cross) + path('M110 236 L480 150 L850 236 Z', fill.white);
  s += label(480, 214, 'CURIOSITIES', { size: 16, anchor: 'middle', spacing: 6, serif: true });
  s += rect(40, 254, 880, 18, fill.hatch);
  s += rect(56, 272, 848, 428, fill.white) + path('M56 272 V700 M904 272 V700', { 'stroke-width': 3 });
  for (let x = 70; x < 904; x += 34) s += path(`M${x} 273 V699`, light);
  // Two columns frame the opening.
  for (const x of [40, 884]) s += rect(x, 272, 36, 428, fill.white) + path(`M${x + 9} 280 V692 M${x + 18} 280 V692 M${x + 27} 280 V692`, light);
  return s;
}

function cabinet() {
  let s = rect(120, 300, 540, 396, fill.hatch) + rect(134, 312, 512, 378, fill.white);
  s += path('M110 300 H670 M112 296 l20 -14 H648 l20 14', { 'stroke-width': 2.4 });
  for (const y of SHELVES) s += rect(134, y, 512, 8, fill.light);
  // Open glass doors, swung out on either side.
  s += path('M120 306 L84 324 V676 L120 690 Z M660 306 L696 324 V676 L660 690 Z', fill.white);
  s += path('M90 340 l20 -8 M90 360 l26 -10 M670 330 l20 8 M670 350 l20 8', light);
  // Drawn curiosities between the photographs.
  s += path('M410 572 V538 Q410 528 420 528 H452 Q462 528 462 538 V572 Z M462 548 h10 v8 h-10', fill.white);   // ship in a bottle
  s += path('M418 560 L436 560 L432 568 H422 Z M427 560 V540 L438 556 H427', thin);
  s += circle(586, 560, 12, fill.white) + circle(606, 564, 9, fill.white) + circle(596, 548, 7, fill.white); // marbles
  for (let i = 0; i < 6; i++) s += rect(150 + i * 13, 674 - 40 - (i % 3) * 6, 11, 40 + (i % 3) * 6, i % 2 ? fill.hatch : fill.white);
  s += path('M340 674 v-26 q0 -14 14 -14 h20 q14 0 14 14 v26 Z M352 634 q12 -16 24 0', fill.white);                // bell
  s += path('M500 674 l10 -40 h40 l10 40 Z M512 646 h36', fill.white);                                          // a drum
  s += tag(268, 392, 'globe') + tag(472, 392, 'n°7') + tag(256, 486, 'albarello') + tag(410, 486, 'key?') + tag(610, 486, 'tick') + tag(300, 580, 'tiny') + tag(470, 580, 'ship');
  return s;
}

function curator() {
  // A rolling ladder, a stool, and Professor Hoot.
  let s = path('M676 700 L640 300 M714 700 L678 300', { 'stroke-width': 2 });
  for (let y = 340; y < 700; y += 40) s += path(`M${640 + (y - 300) * 0.09} ${y} H${680 + (y - 300) * 0.09}`, thin);
  s += path('M748 700 l6 -60 h40 l6 60 M752 670 h44', thin) + rect(744, 632, 60, 10, fill.white);
  s += path('M752 632 Q744 576 774 562 Q804 576 796 632 Z', fill.hatch);
  s += path('M752 600 Q774 616 796 600', thin);
  s += circle(774, 552, 22, fill.white) + path('M756 538 l-6 -14 l14 8 M792 538 l6 -14 l-14 8', fill.white);
  s += circle(766, 552, 7, fill.white) + circle(784, 552, 7, fill.white) + circle(766, 552, 2.4, fill.ink) + circle(784, 552, 2.4, fill.ink);
  s += circle(784, 552, 9) + path('M793 554 q8 16 0 30', thin) + path('M771 562 l3 5 l3 -5 Z', fill.ink);
  return s;
}

function prismCase() {
  // A bell jar on a plinth, with a prism inside. Paint it and light splits apart.
  let s = rect(818, 600, 70, 100, fill.white) + path('M812 600 h82 M812 604 h82', thin);
  s += path('M826 600 V520 Q826 476 853 476 Q880 476 880 520 V600', fill.white) + path('M836 512 q4 -20 16 -26', light);
  s += path('M838 590 L853 548 L868 590 Z', fill.white) + path('M853 548 L846 590 M853 548 L860 590', thin);
  // A fish skeleton framed on the wall above.
  s += rect(784, 300, 104, 70, fill.white) + rect(792, 308, 88, 54);
  s += path('M806 335 H860 M816 335 l-6 -10 M816 335 l-6 10 M828 335 l-6 -12 M828 335 l-6 12 M840 335 l-6 -12 M840 335 l-6 12 M852 335 l-6 -10 M852 335 l-6 10 M860 335 l12 -10 v20 Z', thin) + circle(802, 334, 5);
  return s;
}

const art = () => {
  const r = random(404);
  return sectionSVG(groundStrip(r, { manhole: 480 }) + building(r) + cabinet() + curator() + prismCase());
};

const colourWash = () => washSVG(
  wash('M40 254 L480 120 L920 254 Z', COLORS.teal.hex, 0.3) +
  wash('M120 300 H660 V696 H120 Z', COLORS.rust.hex, 0.25) +
  wash('M56 272 H904 V700 H56 Z', COLORS.sand.hex, 0.25) +
  wash('M826 600 V520 Q826 476 853 476 Q880 476 880 520 V600 Z', COLORS.lavender.hex, 0.5) +
  wash('M752 632 Q744 576 774 562 Q804 576 796 632 Z', COLORS.moss.hex, 0.45),
);

const beams = () => path('M853 560 L700 470 M853 560 L700 520 M853 560 L700 570', { stroke: '#a39e93', 'stroke-dasharray': '2 6' });

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.2) {      // dust in the light
    for (let i = 0; i < 14; i++) {
      const x = 160 + ((i * 61 + t / (90 + i * 7)) % 480), y = 320 + ((i * 37 + Math.sin(t / 1400 + i) * 40) % 340);
      ctx.fillStyle = 'rgba(41,40,36,0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (warmth > 0.1) {      // Professor Hoot blinks
    const shut = (t % 4200) < 160;
    if (shut) {
      ctx.fillStyle = '#fffdf8';
      ctx.strokeStyle = '#292824';
      ctx.lineWidth = 1.4;
      for (const x of [766, 784]) {
        ctx.beginPath();
        ctx.arc(x, 552, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 6, 552);
        ctx.lineTo(x + 6, 552);
        ctx.stroke();
      }
    }
  }
  if (has('prism')) {      // a rainbow fanning out of the prism
    const hues = ['226,114,91', '240,180,41', '106,153,78', '95,168,211', '169,139,214'];
    hues.forEach((h, i) => {
      const a = Math.PI + 0.35 - i * 0.14 + Math.sin(t / 1200) * 0.04;
      ctx.fillStyle = `rgba(${h},0.32)`;
      ctx.beginPath();
      ctx.moveTo(853, 566);
      ctx.lineTo(853 + Math.cos(a) * 260, 566 + Math.sin(a) * 260);
      ctx.lineTo(853 + Math.cos(a - 0.12) * 260, 566 + Math.sin(a - 0.12) * 260);
      ctx.fill();
    });
  }
}

export default {
  id: 'cabinet',
  name: 'The Cabinet of Curiosities',
  col: -2,
  row: 0,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'globe', x: 222, y: 340, h: 90, rotate: 0, tape: 0 },
    { src: 'compass-sundial', x: 400, y: 356, h: 64, rotate: -6, tape: 0 },
    { src: 'pharmacy-jar', x: 210, y: 444, h: 80, rotate: 0, tape: 0 },
    { src: 'key', x: 360, y: 444, h: 78, rotate: 12, tape: 1 },
    { src: 'green-clock', x: 560, y: 438, h: 88, rotate: 2, tape: 2 },
    { src: 'tiny-shoe', x: 252, y: 552, h: 56, rotate: -3, tape: 0 },
  ],
  finds: [
    { id: 'color:rust', x: 548, y: 368, clue: 'on the top shelf' },
    { id: 'mod:rainbow', x: 853, y: 660, hidden: 'prism', clue: 'something under glass' },
  ],
  secrets: [{ id: 'prism', x: 853, y: 572, r: 22, amount: 30, reveal: beams, say: 'The prism splits the light into colours.' }],
  residents: [{
    id: 'hoot', name: 'Professor Hoot', x: 774, y: 632, w: 60, h: 100,
    lines: ({ warmth, has }) => [
      ...(has('prism') ? ['Splendid! A rainbow, filed under R. Take the ribbon; it has been waiting for a hand like yours.'] : []),
      ...(warmth > 0.5 ? ['The labels are legible again. I could weep.'] : []),
      'Welcome to the Cabinet. Everything here is real, you know. Every single thing.',
      'Tap anything with the little hand and I will tell you where it came from.',
      'The prism in the bell jar has not seen a colour in years.',
    ],
  }],
};
