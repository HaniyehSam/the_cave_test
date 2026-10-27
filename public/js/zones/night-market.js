// The Night Market: lantern strings, a noodle cart, cloth, spices and a fortune teller.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, at, label, fill, TONE, random, groundStrip,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

// The three lantern strings: Paper Street's wire → pole → pole → onwards east.
const STRINGS = [[[0, 262], [150, 304], [300, 236]], [[300, 236], [510, 312], [720, 236]], [[720, 236], [860, 300], [960, 262]]];
const along = ([a, b, c], t) => [0, 1].map((i) => (1 - t) ** 2 * a[i] + 2 * (1 - t) * t * b[i] + t * t * c[i]);
const LANTERNS = [[0, 0.35], [0, 0.72], [1, 0.2], [1, 0.42], [1, 0.62], [1, 0.84], [2, 0.3], [2, 0.66]].map(([s, t], i) => {
  const [x, y] = along(STRINGS[s], t);
  return { x: Math.round(x), y: Math.round(y), big: i === 3 };
});

function lantern({ x, y, big }) {
  const k = big ? 1.35 : 1, ry = 17 * k, rx = 14 * k, cy = y + 12 + ry;
  return path(`M${x} ${y} V${y + 12}`, thin) +
    ellipse(x, cy, rx, ry, fill.white) +
    path(`M${x} ${cy - ry} Q${x - rx * 0.9} ${cy} ${x} ${cy + ry} M${x} ${cy - ry} Q${x + rx * 0.9} ${cy} ${x} ${cy + ry} M${x - rx} ${cy} H${x + rx}`, light) +
    rect(x - 7 * k, cy - ry - 3, 14 * k, 5, fill.white) + rect(x - 7 * k, cy + ry - 2, 14 * k, 5, fill.white) +
    path(`M${x} ${cy + ry + 3} v12 M${x - 3} ${cy + ry + 15} h6`, thin);
}

function sky(r) {
  let s = '';
  // A sleepy moon.
  s += circle(520, 110, 46, fill.white) + path('M500 104 q6 5 12 0 M528 104 q6 5 12 0 M512 128 q8 4 16 0', thin);
  s += circle(492, 86, 6, light) + circle(548, 132, 4, light);
  for (let i = 0; i < 16; i++) {
    const x = 30 + r() * 900, y = 30 + r() * 170, k = 3 + r() * 4;
    if (Math.hypot(x - 520, y - 110) < 70) continue;
    s += path(`M${x.toFixed(0)} ${(y - k).toFixed(0)} v${2 * k} M${(x - k).toFixed(0)} ${y.toFixed(0)} h${2 * k}`, thin);
  }
  // Lantern poles and strings, and a kite caught on the far string.
  for (const x of [300, 720]) s += path(`M${x} 700 V230 M${x - 10} 700 h20`, { 'stroke-width': 2.4 }) + circle(x, 222, 7, fill.white);
  for (const [a, b, c] of STRINGS) s += path(`M${a[0]} ${a[1]} Q${b[0]} ${b[1]} ${c[0]} ${c[1]}`, thin);
  s += path('M880 236 L908 210 L934 238 L906 274 Z M880 236 H934 M908 210 V274', fill.white) + path('M906 274 q-6 20 6 34 q10 14 0 30', thin);
  return s;
}

function spiceStall() {
  let s = path('M40 700 V470 M240 700 V470', { 'stroke-width': 2 });
  s += rect(28, 470, 224, 34, fill.white);
  for (let x = 28; x < 252; x += 28) s += rect(x, 470, 14, 34, fill.hatch);
  s += path('M28 504 ' + 'a14 14 0 0 0 28 0 '.repeat(8), fill.white);
  // The hanging scale.
  s += path('M150 518 v24 M150 542 l-20 18 M150 542 l20 18', thin) + path('M126 560 h48 q-6 12 -24 12 q-18 0 -24 -12 Z', fill.white);
  // Table, cloth, crates of apples and oranges, sacks of spice.
  s += rect(36, 610, 208, 10, fill.white) + path('M42 620 V700 M238 620 V700 M42 620 Q80 640 120 622 Q160 640 200 622 Q222 634 238 620', thin);
  s += rect(50, 576, 70, 34, fill.white) + path('M50 590 H120 M50 600 H120', light);
  for (const [x, y] of [[60, 572], [76, 568], [92, 572], [108, 568], [68, 560], [100, 560]]) s += circle(x, y, 8, fill.white) + path(`M${x} ${y - 8} l2 -4`, thin);
  s += rect(128, 576, 64, 34, fill.white);
  for (const [x, y] of [[138, 570], [154, 566], [170, 570], [184, 566], [146, 556], [176, 556]]) s += circle(x, y, 8, fill.dots);
  s += path('M198 610 Q196 584 206 580 Q218 572 230 580 Q240 586 238 610 Z', fill.hatch) + path('M204 584 Q218 570 232 584', fill.white);
  s += path('M226 576 l14 -18 M236 556 l6 6', thin);
  // Mr Pepper, tall, with a hat and a magnificent moustache.
  s += path('M84 556 Q86 528 100 526 Q114 528 116 556', fill.white) + circle(100, 512, 11, fill.white);
  s += rect(88, 482, 24, 20, fill.ink) + path('M82 502 h36', { 'stroke-width': 2 });
  s += path('M92 518 q4 -4 8 0 q4 -4 8 0 M95 510 h1 M105 510 h1', { 'stroke-width': 1.3 });
  return s;
}

function noodleCart() {
  let s = '';
  s += path('M320 506 L400 466 L480 506 Z', fill.cross) + path('M336 506 V590 M464 506 V590', { 'stroke-width': 2 });
  s += rect(330, 590, 140, 66, fill.white) + path('M330 612 H470 M330 634 H470', light) + label(400, 628, 'NOODLES', { size: 12, anchor: 'middle', spacing: 3 });
  s += path('M330 600 H300 V588', { 'stroke-width': 2 });
  for (const x of [360, 440]) {
    s += circle(x, 672, 24, fill.white) + circle(x, 672, 4);
    for (let a = 0; a < 6; a++) s += path(`M${x} 672 l${(Math.cos(a) * 22).toFixed(1)} ${(Math.sin(a) * 22).toFixed(1)}`, thin);
  }
  // The big pot, a ladle and a stack of bowls.
  s += path('M384 590 V560 H436 V590', fill.white) + ellipse(410, 560, 26, 5, fill.white) + path('M430 556 L448 528', thin);
  s += path('M344 590 q8 8 16 0 Z M342 582 q10 8 20 0 Z', fill.white);
  // Auntie Mei, with her headscarf and ladle.
  s += path('M482 700 V680 M498 700 V680', thin);
  s += path('M472 682 Q470 630 490 626 Q510 630 508 682 Z', fill.white) + path('M478 646 H502 V680 H478 Z', fill.hatch);
  s += circle(490, 610, 13, fill.white) + path('M476 606 Q490 586 504 606 Q500 596 490 596 Q480 596 476 606 Z M504 604 l8 8', fill.white);
  s += path('M485 610 h1 M494 610 h1 M486 617 q4 3 8 0 M472 650 L456 628 M454 626 l-4 -8', thin);
  return s;
}

function clothStall() {
  let s = path('M550 700 V444 M700 700 V444 M540 448 H710', { 'stroke-width': 2 });
  const cloths = [fill.hatch, fill.white, fill.dots, fill.cross, fill.white];
  cloths.forEach((f, i) => {
    const x = 560 + i * 27, len = 120 + ((i * 37) % 50);
    s += circle(x + 11, 448, 4) + path(`M${x} 452 H${x + 22} V${452 + len} Q${x + 16} ${458 + len} ${x + 11} ${452 + len} Q${x + 6} ${446 + len} ${x} ${452 + len} Z`, f);
  });
  for (let y = 470; y < 560; y += 12) s += path(`M588 ${y} h22`, light);   // the plain cloth has thin stripes
  s += path('M560 700 L566 654 H686 L692 700 Z', fill.white);
  for (const x of [576, 606, 636, 664]) s += ellipse(x, 648, 13, 8, fill.white) + circle(x, 648, 3);
  s += rect(568, 418, 120, 22, fill.white) + label(628, 433, 'CLOTH & THREAD', { size: 9, anchor: 'middle', spacing: 1.4 });
  return s;
}

function fortuneTent() {
  let s = path('M850 474 V430 L884 442 L850 454', fill.white);
  s += path('M756 700 L850 474 L944 700 Z', fill.cross) + path('M800 700 Q830 620 850 562 Q870 620 900 700 Z', fill.white);
  s += path('M800 700 Q812 640 830 610 M900 700 Q888 640 870 610', thin);
  // Madame Lune behind her crystal ball.
  s += path('M826 660 Q828 626 850 622 Q872 626 874 660', fill.hatch) + circle(850, 606, 11, fill.white);
  s += path('M836 604 Q850 584 864 604 L866 626 Q850 616 834 626 Z', fill.white) + path('M845 606 h2 M853 606 h2', thin);
  s += circle(850, 650, 14, fill.white) + path('M842 644 q4 -5 9 -4', thin);
  s += path('M824 664 H876 L870 700 M830 664 L826 700', fill.white);
  s += rect(782, 520, 136, 22, fill.white) + label(850, 535, 'MADAME LUNE', { size: 10, anchor: 'middle', spacing: 2 });
  return s;
}

function biscuit() {
  // Biscuit the market dog, nose to the cobbles.
  return path('M512 696 Q508 676 526 674 H548 Q560 672 562 662 Q566 654 574 660 L578 670 Q578 682 566 684 V696 M528 684 V698 M552 684 V698 M512 680 q-10 -8 -6 -18', fill.white) +
    path('M562 662 l4 -10 l4 8 M572 666 h1', thin) + circle(578, 672, 2, fill.ink);
}

const art = () => {
  const r = random(202);
  return sectionSVG(groundStrip(r, { cobbles: true }) + sky(r) + LANTERNS.map(lantern).join('') + spiceStall() + noodleCart() + clothStall() + fortuneTent() + biscuit());
};

const colourWash = () => washSVG(
  wash('M0 0 H960 V230 H0 Z', COLORS.lavender.hex, 0.3) +
  wash('M474 110 a46 46 0 1 0 92 0 a46 46 0 1 0 -92 0 Z', COLORS.marigold.hex, 0.5) +
  LANTERNS.map(({ x, y }) => wash(`M${x - 34} ${y + 30} a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0 Z`, COLORS.lantern.hex, 0.4)).join('') +
  wash('M28 470 H252 V512 H28 Z', COLORS.lantern.hex, 0.35) +
  wash('M50 552 H192 V610 H50 Z', COLORS.coral.hex, 0.4) +
  wash('M320 506 L400 466 L480 506 V656 H330 Z', COLORS.teal.hex, 0.25) +
  wash('M556 452 H696 V600 H556 Z', COLORS.lavender.hex, 0.35) +
  wash('M756 700 L850 474 L944 700 Z', COLORS.lavender.hex, 0.3) +
  wash('M0 722 H960 V850 H0 Z', COLORS.marigold.hex, 0.15),
);

// ---------- Secrets ----------

const glowing = () => LANTERNS.map(({ x, y, big }) => {
  const k = big ? 1.35 : 1, cy = y + 12 + 17 * k;
  return path(`M${x - 20 * k} ${cy} l-8 0 M${x + 20 * k} ${cy} l8 0 M${x} ${cy + 28 * k} l0 8`, thin);
}).join('');
const vision = () => path('M838 652 q6 -8 12 0 q6 8 12 0', { stroke: '#8f8a7e' }) + path('M850 628 v-12 M836 632 l-8 -8 M864 632 l8 -8', thin);

// ---------- Life ----------

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.15) {   // noodle steam
    ctx.strokeStyle = '#29282455';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const k = (t / 2200 + i / 3) % 1;
      ctx.beginPath();
      ctx.moveTo(398 + i * 12, 552 - k * 70);
      ctx.bezierCurveTo(390 + i * 12, 540 - k * 70, 412 + i * 12, 530 - k * 70, 400 + i * 12, 516 - k * 70);
      ctx.globalAlpha = 1 - k;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  const glow = has('lanterns') ? 1 : warmth > 0.35 ? 0.4 : 0;
  if (glow) {             // lanterns breathe with warm light
    for (const [i, { x, y, big }] of LANTERNS.entries()) {
      const k = big ? 1.35 : 1, cy = y + 12 + 17 * k, pulse = 0.75 + Math.sin(t / 700 + i) * 0.25;
      const g = ctx.createRadialGradient(x, cy, 2, x, cy, 46 * k);
      g.addColorStop(0, `rgba(240,180,41,${0.45 * glow * pulse})`);
      g.addColorStop(1, 'rgba(240,180,41,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, cy, 46 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (has('lanterns')) {  // moths
    ctx.fillStyle = '#292824';
    for (let i = 0; i < 3; i++) {
      const L = LANTERNS[i * 3], a = t / (500 + i * 90) + i;
      const x = L.x + Math.cos(a) * 26, y = L.y + 30 + Math.sin(a * 1.3) * 18, flap = Math.abs(Math.sin(t / 60 + i)) * 4 + 1;
      ctx.beginPath();
      ctx.ellipse(x - 3, y, 3, flap, 0.4, 0, Math.PI * 2);
      ctx.ellipse(x + 3, y, 3, flap, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (has('crystal')) {   // the crystal ball swirls
    ctx.strokeStyle = COLORS.teal.hex;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(850, 650, 8 + Math.sin(t / 300) * 2, t / 400, t / 400 + 4);
    ctx.stroke();
  }
  if (warmth > 0.6) {     // fireflies
    for (let i = 0; i < 7; i++) {
      const x = (i * 137 + t / (30 + i * 4)) % 960, y = 380 + Math.sin(t / 900 + i * 2) * 60 + i * 12;
      ctx.fillStyle = `rgba(240,180,41,${0.4 + Math.sin(t / 250 + i) * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Biscuit's tail, always.
  ctx.strokeStyle = '#292824';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(512, 680);
  ctx.quadraticCurveTo(500 + Math.sin(t / 150) * 6, 668, 504 + Math.sin(t / 150) * 8, 660);
  ctx.stroke();
}

const big = LANTERNS.find((l) => l.big);

export default {
  id: 'market',
  name: 'The Night Market',
  col: 1,
  row: 0,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'apple-red', x: 300, y: 410, h: 84, rotate: -4, tape: 2 },
    { src: 'pear-green', x: 720, y: 380, h: 92, rotate: 3, tape: 2 },
    { src: 'jar-blue', x: 266, y: 668, h: 62, rotate: 0, tape: 0 },
  ],
  finds: [
    { id: 'mod:wiggle', x: 84, y: 548, clue: 'something wriggles in the apples' },
    { id: 'color:marigold', x: 218, y: 554, clue: 'among the spices' },
    { id: 'color:lantern', x: 352, y: 566, clue: 'on the noodle cart' },
    { id: 'pattern:dots', x: 448, y: 612, clue: 'pinned to the cart' },
    { id: 'pattern:stripes', x: 626, y: 624, clue: 'with the cloth' },
    { id: 'color:teal', x: 884, y: 688, hidden: 'crystal', clue: 'ask the crystal ball' },
  ],
  secrets: [
    { id: 'lanterns', x: big.x, y: big.y + 35, r: 34, amount: 40, reveal: glowing, say: 'The lanterns are glowing again.' },
    { id: 'crystal', x: 850, y: 650, r: 16, amount: 20, reveal: vision, say: 'The crystal ball clears.' },
  ],
  residents: [
    {
      id: 'pepper', name: 'Mr Pepper', x: 100, y: 560, w: 40, h: 80,
      lines: ({ warmth }) => [
        ...(warmth > 0.5 ? ['Ha! Look at those oranges. Properly orange again.'] : []),
        'Apples! Oranges! Spices! Paint, if you have got any.',
        'Careful with that crate. Something in there wriggles.',
      ],
    },
    {
      id: 'mei', name: 'Auntie Mei', x: 490, y: 700, w: 44, h: 110,
      lines: ({ has }) => has('lanterns')
        ? ['Red lanterns! Now people can find us from the bridge.', 'Have a bowl. The steam is the best part.']
        : ['Noodles are on. The steam is the best part.', 'My lanterns used to glow. Paint the big one in the middle, would you?'],
    },
    {
      id: 'lune', name: 'Madame Lune', x: 850, y: 640, w: 50, h: 50,
      lines: ({ has }) => has('crystal')
        ? ['Teal. I see teal in your future. Take it, it was always yours.', 'Next, I see a greenhouse. To the west, past your street.']
        : ['I see… a pencil in your future.', 'Colour the ball, child. It shows me nothing in grey.'],
    },
    { id: 'biscuit', name: 'Biscuit', x: 540, y: 700, w: 60, h: 40, lines: () => ['Woof.', '(Biscuit sniffs your pencil very seriously.)', '(Biscuit has found a noodle.)'] },
  ],
};
