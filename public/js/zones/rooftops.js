// The Rooftops: a little village of roofs floating on a cloud above Paper Street.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, label, fill, TONE, random, cloud,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

function cloudBank() {
  return path('M60 760 Q40 720 90 712 Q100 670 160 690 Q200 650 260 684 Q330 660 380 690 Q450 664 520 692 Q590 662 650 690 Q720 664 780 694 Q850 676 880 716 Q920 730 896 768 Q860 820 760 806 Q660 840 540 812 Q420 840 300 810 Q180 836 110 800 Q50 790 60 760 Z', fill.white) +
    path('M140 790 q30 10 60 0 M420 818 q40 10 80 0 M700 800 q30 10 60 0', light);
}

function roofs() {
  let s = '';
  // A steep tiled gable with a tall chimney.
  s += rect(210, 488, 40, 110, fill.cross) + rect(204, 480, 52, 12, fill.white) + rect(214, 466, 12, 14, fill.white) + rect(234, 470, 12, 10, fill.white);
  s += path('M90 700 V610 L215 520 L340 610 V700', fill.white) + path('M84 612 L215 516 L346 612', { 'stroke-width': 2.4 });
  for (let y = 556; y < 700; y += 18) {
    const half = Math.min(122, (y - 520) * 1.3);   // follow the roof slope, stop at the walls
    s += path(`M${(215 - half).toFixed(0)} ${y} H${(215 + half).toFixed(0)}`, light);
  }
  s += rect(190, 640, 50, 60, fill.white) + path('M215 640 V700 M190 670 H240', thin);
  // TV aerial with a kite tangled in it.
  s += path('M150 566 V420 M126 440 H174 M132 460 H168 M138 480 H162', thin);
  s += path('M152 420 L176 392 L196 420 L172 452 Z', fill.white) + path('M176 392 L172 452 M152 420 H196', thin) + path('M172 452 Q160 470 150 466 Q140 480 154 490', thin);
  // A mansard roof with a round dormer.
  s += path('M380 700 V560 L410 500 H570 L600 560 V700', fill.white) + path('M376 562 H604 M406 500 H574', { 'stroke-width': 2.4 });
  for (let x = 420; x < 570; x += 16) s += path(`M${x} 502 V558`, light);
  s += circle(490, 620, 30, fill.white) + circle(490, 620, 22) + path('M468 620 H512 M490 598 V642', thin);
  s += rect(540, 456, 34, 50, fill.cross) + rect(534, 450, 46, 10, fill.white);
  // Flat roof: water tower and a little shed.
  s += rect(640, 640, 240, 60, fill.white) + path('M636 640 H884', { 'stroke-width': 2.4 });
  s += path('M800 640 L790 560 M860 640 L870 560 M790 560 H870 M795 600 H865 M790 560 L865 600 M870 560 L795 600', thin);
  s += path('M786 560 V500 Q786 486 830 486 Q874 486 874 500 V560 Z', fill.hatch) + path('M780 486 L830 452 L880 486', fill.white);
  s += rect(660, 560, 100, 80, fill.white) + path('M660 560 L710 534 L760 560', fill.white) + rect(670, 590, 26, 50, fill.white);
  return s;
}

function laundry() {
  // A washing line from the gable chimney to the mansard chimney, heavy with washing.
  let s = path('M246 486 Q400 540 540 470', thin);
  const along = (t) => [246 + (540 - 246) * t, 486 + (540 - 486) * 2 * t * (1 - t) * 1.6 + (470 - 486) * t];
  [[0.18, 'shirt'], [0.34, 'sock'], [0.5, 'dress'], [0.68, 'sock'], [0.84, 'towel']].forEach(([t, kind]) => {
    const [x, y] = along(t);
    const X = x.toFixed(0), Y = y.toFixed(0);
    if (kind === 'shirt') s += path(`M${X - 18} ${Y} L${+X - 26} ${+Y + 14} L${+X - 18} ${+Y + 18} V${+Y + 44} H${+X + 18} V${+Y + 18} L${+X + 26} ${+Y + 14} L${+X + 18} ${Y} Q${X} ${+Y + 8} ${X - 18} ${Y} Z`, fill.white);
    if (kind === 'sock') s += path(`M${X - 5} ${Y} V${+Y + 22} Q${X - 5} ${+Y + 30} ${+X + 6} ${+Y + 30} H${+X + 12} V${+Y + 22} H${+X + 5} V${Y} Z`, fill.hatch);
    if (kind === 'dress') s += path(`M${X - 10} ${Y} L${X - 12} ${+Y + 16} L${X - 26} ${+Y + 56} H${+X + 26} L${+X + 12} ${+Y + 16} L${+X + 10} ${Y} Z`, fill.dots);
    if (kind === 'towel') s += rect(+X - 16, +Y, 32, 40, fill.white) + path(`M${X - 16} ${+Y + 30} H${+X + 16}`, thin);
    s += path(`M${X - 3} ${+Y - 4} v8 M${+X + 3} ${+Y - 4} v8`, thin);
  });
  return s;
}

function sweep() {
  // Ray the sweep, sitting on the mansard ledge with a brush.
  return path('M416 560 Q414 530 430 526 Q446 530 446 560 Z', fill.hatch) + circle(430, 514, 10, fill.white) +
    rect(422, 488, 16, 18, fill.ink) + path('M416 506 h28', { 'stroke-width': 2 }) +
    path('M425 514 h1 M434 514 h1 M426 520 q4 3 8 0 M444 540 L470 478', thin) + path('M462 470 l16 16 M466 468 l14 18 M470 466 l12 18', thin);
}

const art = () => {
  const r = random(707);
  return sectionSVG(cloud(60, 180, 150, r) + cloud(380, 120, 120, r) + cloudBank() + roofs() + laundry() + sweep());
};

const colourWash = () => washSVG(
  wash('M0 0 H960 V960 H0 Z', COLORS.pond.hex, 0.14) +
  wash('M90 700 V610 L215 520 L340 610 V700 Z', COLORS.rust.hex, 0.35) +
  wash('M380 700 V560 L410 500 H570 L600 560 V700 Z', COLORS.plum.hex, 0.25) +
  wash('M786 560 V500 Q786 486 830 486 Q874 486 874 500 V560 Z', COLORS.teal.hex, 0.4) +
  wash('M250 486 Q400 560 540 470 V540 H250 Z', COLORS.mint.hex, 0.4),
);

const freeKite = () => path('M150 420 H174 M132 460 H168', thin);

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.15) {     // smoke from both chimneys
    for (const [cx, cy] of [[230, 462], [557, 446]])
      for (let i = 0; i < 4; i++) {
        const k = (t / 2400 + i / 4) % 1;
        ctx.strokeStyle = `rgba(41,40,36,${0.4 * (1 - k)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(cx + k * 30 + Math.sin(k * 6 + i) * 6, cy - k * 120, 4 + k * 12, 0, Math.PI * 2);
        ctx.stroke();
      }
  }
  if (warmth > 0.3) {      // the breeze
    ctx.strokeStyle = 'rgba(41,40,36,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const x = (t / 12 + i * 330) % 1100 - 70, y = 380 + i * 40;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 30, y - 10, x + 50, y + 10, x + 80, y);
      ctx.stroke();
    }
  }
  if (has('kite')) {       // the kite flies free
    const x = 240 + Math.sin(t / 1600) * 60, y = 200 + Math.cos(t / 1200) * 30;
    ctx.strokeStyle = '#292824';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(430, 524);
    ctx.quadraticCurveTo(320, 360, x, y + 30);
    ctx.stroke();
    ctx.fillStyle = COLORS.lantern.hex;
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x + 22, y);
    ctx.lineTo(x, y + 30);
    ctx.lineTo(x - 22, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

export default {
  id: 'rooftops',
  name: 'The Rooftops',
  col: 0,
  row: -1,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'montgolfier', x: 720, y: 240, h: 270, rotate: 3, tape: 2 },
    { src: 'pigeons', x: 710, y: 600, h: 70, rotate: -4, tape: 2 },
  ],
  finds: [
    { id: 'color:mint', x: 394, y: 536, clue: 'pegged to the washing line' },
    { id: 'pattern:bricks', x: 556, y: 428, clue: 'up a chimney' },
  ],
  secrets: [{ id: 'kite', x: 174, y: 422, r: 26, amount: 30, reveal: freeKite, say: 'The kite pulls free and flies!' }],
  residents: [
    {
      id: 'ray', name: 'Ray the sweep', x: 430, y: 560, w: 40, h: 70,
      lines: ({ has, warmth }) => [
        ...(has('kite') ? ['Look at it go! I have been trying to get that down for a year.'] : ['Some kid’s kite is stuck on the aerial. Bright colours scare the tangles off, they say.']),
        ...(warmth > 0.5 ? ['Chimneys are puffing. That means people are home again.'] : []),
        'Up here you can see the whole street. Or you could, if it had any colour.',
      ],
    },
  ],
};
