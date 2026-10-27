// The Odd Greenhouse: a giant sunflower, a hungry flytrap, a pond and a very slow gardener.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, at, label, fill, TONE, random, groundStrip, cloud,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

function glasshouse() {
  let s = '';
  // Glass first (light, so paint flows across panes), then the iron frame on top.
  for (let x = 160; x < 880; x += 80) {
    const top = 180 + ((x - 480) / 400) ** 2 * 240;
    s += path(`M${x} 700 V420 L${x} ${top.toFixed(0)}`, light);
  }
  s += path('M80 560 H880', light);
  s += path('M80 700 V420 Q80 180 480 180 Q880 180 880 420 V700', { 'stroke-width': 3 });
  s += path('M80 420 H880', { 'stroke-width': 2 });
  s += path('M470 180 V160 h20 v20', thin) + circle(480, 150, 8, fill.white);
  // The rose window: paint it and something kaleidoscopic falls out.
  s += circle(480, 250, 42, fill.white) + circle(480, 250, 12, fill.white);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, b = a + Math.PI / 8;
    s += path(`M${(480 + Math.cos(a) * 12).toFixed(1)} ${(250 + Math.sin(a) * 12).toFixed(1)} L${(480 + Math.cos(a) * 42).toFixed(1)} ${(250 + Math.sin(a) * 42).toFixed(1)}`);
    s += circle((480 + Math.cos(b) * 28).toFixed(1), (250 + Math.sin(b) * 28).toFixed(1), 5, thin);
  }
  // Sign hanging from the beam.
  s += path('M420 420 v14 M540 420 v14', thin) + rect(388, 434, 184, 26, fill.white) + label(480, 452, 'THE ODD GREENHOUSE', { size: 11, anchor: 'middle', spacing: 2 });
  return s;
}

function sunflower() {
  let s = path('M180 700 Q170 520 186 344', { 'stroke-width': 3 });
  s += path('M178 560 Q136 540 120 500 Q160 504 178 540 Z M182 470 Q222 444 240 404 Q204 410 184 448 Z M176 630 Q214 616 230 588 Q196 590 176 612 Z', fill.white);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    s += at((186 + Math.cos(a) * 46).toFixed(1), (306 + Math.sin(a) * 46).toFixed(1), ellipse(0, 0, 18, 8, fill.white), { rotate: ((a * 180) / Math.PI).toFixed(0) });
  }
  s += circle(186, 306, 34, fill.dots) + path('M174 300 h2 M196 300 h2 M176 316 q10 8 20 0', { 'stroke-width': 1.4 });
  return s;
}

function flytrap() {
  let s = path('M300 700 L306 646 H354 L360 700 Z', fill.hatch) + rect(298, 638, 64, 10, fill.white);
  s += path('M330 638 Q322 600 336 572', { 'stroke-width': 2 });
  s += path('M312 640 Q290 620 300 600 Q318 612 322 636 M346 640 Q372 624 366 604 Q348 612 340 636', fill.white);
  // Jaws are drawn by the animation so they can chomp; this is the hinge.
  s += circle(336, 572, 4, fill.ink);
  return s;
}

function cactus() {
  let s = path('M570 700 L576 652 H624 L630 700 Z', fill.cross) + rect(566, 644, 68, 10, fill.white);
  s += path('M586 644 V560 Q586 540 600 540 Q614 540 614 560 V644 Z M586 600 H572 Q562 600 562 588 V570 Q562 562 570 564 Q574 566 574 576 V588 H586 M614 590 H628 Q638 590 638 578 V556 Q638 548 630 550 Q626 552 626 562 V578 H614', fill.white);
  for (const [x, y] of [[594, 560], [606, 576], [594, 594], [606, 612], [594, 628], [568, 576], [632, 564]]) s += path(`M${x - 3} ${y} h6`, thin);
  // A tiny hat, for dignity.
  s += path('M588 542 H612 M592 542 V530 H608 V542', fill.ink);
  return s;
}

function hangingFern() {
  let s = path('M720 230 V262 M720 262 L700 300 M720 262 L740 300', thin);
  s += path('M694 300 H746 Q744 324 720 326 Q696 324 694 300 Z', fill.hatch);
  for (const [dx, len] of [[-22, 70], [-10, 96], [4, 84], [18, 64], [-30, 44]]) {
    const x = 720 + dx;
    s += path(`M${x} 304 Q${x - 18} ${304 + len / 2} ${x - 8} ${304 + len}`, thin);
    for (let k = 10; k < len; k += 12) s += path(`M${(x - 12 + k / 12).toFixed(1)} ${304 + k} l-7 4 M${(x - 12 + k / 12).toFixed(1)} ${304 + k} l5 5`, thin);
  }
  return s;
}

function pond() {
  let s = ellipse(480, 688, 92, 16, fill.white) + ellipse(480, 688, 80, 11, light);
  s += path('M430 684 a16 6 0 1 0 30 -2 L446 684 Z', fill.white) + path('M500 690 a18 7 0 1 0 34 -3 L516 690 Z', fill.white);
  // Gloria the frog, on the right-hand lily pad.
  s += path('M506 684 Q506 666 520 666 Q534 666 534 684 Z', fill.white) + circle(512, 664, 6, fill.white) + circle(528, 664, 6, fill.white);
  s += circle(512, 664, 2, fill.ink) + circle(528, 664, 2, fill.ink) + path('M514 676 q6 4 12 0', thin);
  // Reeds.
  s += path('M396 690 Q392 640 400 610 M404 690 Q406 650 416 626 M556 690 Q560 646 552 620', thin);
  s += ellipse(400, 604, 3, 9, fill.ink) + ellipse(416, 620, 3, 8, fill.ink);
  return s;
}

function bench() {
  let s = rect(700, 614, 168, 10, fill.white) + path('M708 624 V700 M860 624 V700 M708 664 H860', { 'stroke-width': 2 });
  s += path('M770 614 L774 594 H796 L800 614 Z', fill.white) + path('M786 594 q-6 -14 4 -20 M786 594 q8 -10 2 -18', thin);
  // Watering can.
  s += path('M820 614 V588 H850 V614 Z M850 596 L868 580 M820 594 q-12 0 -10 -10', fill.white);
  s += path('M716 664 h44 v36 h-44 Z M724 664 v-12 h28 v12', fill.hatch) + label(722, 690, 'SOIL', { size: 8 });
  return s;
}

function snail() {
  // Mr Slow, the gardener, in a sun hat.
  return path('M228 700 H292 Q300 700 302 690 L304 674 Q306 664 298 664 Q292 666 292 680 V688 H236 Z', fill.white) +
    circle(256, 674, 22, fill.white) + path('M256 674 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 1 1 12 12 a18 18 0 0 1 -18 -18', thin) +
    path('M296 664 l-4 -14 M302 664 l4 -14', thin) + circle(292, 649, 2.4, fill.ink) + circle(306, 649, 2.4, fill.ink) +
    path('M286 646 H312 M290 646 Q298 632 306 646', fill.white);
}

function outside(r) {
  let s = groundStrip(r, { manhole: 640 });
  s += cloud(560, 90, 150, r) + cloud(40, 140, 110, r);
  // A hedge on the far left and a wheelbarrow by the door to Paper Street.
  s += path('M0 700 V626 Q14 600 34 616 Q50 596 66 618 L72 700', fill.dots);
  s += path('M890 690 H940 L950 664 H880 Z M880 664 l-14 -10 M912 690 v10', fill.white) + circle(900, 692, 9, fill.white);
  return s;
}

const art = () => {
  const r = random(303);
  return sectionSVG(outside(r) + glasshouse() + sunflower() + hangingFern() + flytrap() + cactus() + pond() + bench() + snail());
};

const colourWash = () => washSVG(
  wash('M80 700 V420 Q80 180 480 180 Q880 180 880 420 V700 Z', COLORS.moss.hex, 0.2) +
  wash('M140 260 a46 46 0 1 0 92 0 a46 46 0 1 0 -92 0 Z', COLORS.marigold.hex, 0.55) +
  wash('M300 640 H360 V700 H300 Z', COLORS.coral.hex, 0.35) +
  wash('M562 540 H640 V650 H562 Z', COLORS.moss.hex, 0.45) +
  wash('M388 688 a92 16 0 1 0 184 0 a92 16 0 1 0 -184 0 Z', COLORS.pond.hex, 0.5) +
  wash('M694 300 H746 V400 H694 Z', COLORS.moss.hex, 0.4) +
  wash('M438 250 a42 42 0 1 0 84 0 a42 42 0 1 0 -84 0 Z', COLORS.lavender.hex, 0.5) +
  wash('M0 0 H960 V180 H0 Z', COLORS.pond.hex, 0.18),
);

// ---------- Secrets ----------

const rays = () => path('M450 290 L380 420 M480 294 V420 M510 290 L580 420', { stroke: '#a39e93', 'stroke-dasharray': '2 8' });
const ripples = () => ellipse(470, 688, 40, 6, light) + ellipse(470, 688, 58, 9, light);

// ---------- Life ----------

function alive(ctx, t, { warmth, has }) {
  // The flytrap's jaws (always drawn: when cold they hang open and still).
  const chomp = warmth > 0.15 ? Math.max(0, Math.sin(t / 900)) ** 6 : 0;
  ctx.save();
  ctx.translate(336, 572);
  ctx.strokeStyle = '#292824';
  ctx.fillStyle = '#fffdf8';
  ctx.lineWidth = 1.6;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.55 - chomp * 0.5) - 0.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * 6, -34, side * 24, -40);
    ctx.quadraticCurveTo(side * 30, -14, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let k = 1; k <= 4; k++) {   // teeth along the rim
      ctx.moveTo(side * (2 + k * 4), -k * 9);
      ctx.lineTo(side * (k * 4 - 6), -k * 9 - 4);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  if (warmth > 0.3) {     // butterflies
    const hues = [COLORS.coral.hex, COLORS.lavender.hex, COLORS.marigold.hex];
    for (let i = 0; i < 3; i++) {
      const a = t / (2400 + i * 500) + i * 2;
      const x = 480 + Math.cos(a) * (260 - i * 50), y = 420 + Math.sin(a * 1.7) * 90 - i * 30;
      const flap = Math.abs(Math.sin(t / 90 + i));
      ctx.fillStyle = hues[i];
      ctx.beginPath();
      ctx.ellipse(x - 5, y, 6, 2 + flap * 6, 0.5, 0, Math.PI * 2);
      ctx.ellipse(x + 5, y, 6, 2 + flap * 6, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (has('pond')) {      // fish under the surface
    for (let i = 0; i < 3; i++) {
      const a = t / (1500 + i * 300) + i * 2.1, x = 480 + Math.cos(a) * (66 - i * 12), y = 690 + Math.sin(a) * 6;
      ctx.fillStyle = i === 1 ? COLORS.marigold.hex : COLORS.coral.hex;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(Math.sin(a) > 0 ? -1 : 1, 1);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 3.4, 0, 0, Math.PI * 2);
      ctx.moveTo(7, 0);
      ctx.lineTo(13, -4);
      ctx.lineTo(13, 4);
      ctx.fill();
      ctx.restore();
    }
  }
  if (has('rose')) {      // coloured light turning slowly under the rose window
    const hues = ['226,114,91', '240,180,41', '42,157,143', '169,139,214'];
    for (let i = 0; i < 4; i++) {
      const a = t / 4000 + (i * Math.PI) / 2;
      ctx.fillStyle = `rgba(${hues[i]},0.16)`;
      ctx.beginPath();
      ctx.moveTo(480, 290);
      ctx.lineTo(480 + Math.cos(a) * 160 - 30, 470);
      ctx.lineTo(480 + Math.cos(a) * 160 + 30, 470);
      ctx.fill();
    }
  }
  // Gloria's throat puffs.
  const puff = Math.max(0, Math.sin(t / 500)) ** 4 * 4;
  ctx.fillStyle = '#fffdf8';
  ctx.strokeStyle = '#292824';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(520, 680, 5 + puff, 2 + puff * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export default {
  id: 'greenhouse',
  name: 'The Odd Greenhouse',
  col: -1,
  row: 0,
  art,
  wash: colourWash,
  alive,
  photos: [{ src: 'cherries', x: 808, y: 500, h: 92, rotate: 4, tape: 2 }],
  finds: [
    { id: 'color:moss', x: 742, y: 596, clue: 'on the potting bench' },
    { id: 'mod:sprout', x: 810, y: 568, clue: 'on the potting bench' },
    { id: 'color:lavender', x: 720, y: 346, clue: 'in a hanging basket' },
    { id: 'pattern:waves', x: 380, y: 676, clue: 'by the pond' },
    { id: 'pattern:checks', x: 130, y: 676, clue: 'at the sunflower’s feet' },
    { id: 'color:pond', x: 572, y: 680, hidden: 'pond', clue: 'the pond has lost its colour' },
    { id: 'mod:kaleido', x: 480, y: 330, hidden: 'rose', clue: 'high up in the glass' },
  ],
  secrets: [
    { id: 'pond', x: 470, y: 690, r: 40, amount: 60, reveal: ripples, say: 'Fish! The pond is alive.' },
    { id: 'rose', x: 480, y: 250, r: 40, amount: 60, reveal: rays, say: 'Light pours through the rose window.' },
  ],
  residents: [
    {
      id: 'slow', name: 'Mr Slow', x: 266, y: 700, w: 80, h: 56,
      lines: ({ warmth }) => [
        ...(warmth > 0.5 ? ['Did you see? The flytrap is hungry again. A very good sign.'] : []),
        'Slowly. Everything in here grows slowly.',
        'The pond used to be blue, you know. Bluer than blue.',
        'If you find my seed packet, plant it anywhere. Lines grow, with those seeds.',
      ],
    },
    {
      id: 'gloria', name: 'Gloria', x: 520, y: 688, w: 40, h: 34,
      lines: ({ has }) => has('pond')
        ? ['The fish are back! Lovely. Slightly nippy.', 'Ribbit. That means thank you.']
        : ['Ribbit. That is “hello” in frog.', 'Paint the water, would you? It is far too grey to swim in.'],
    },
    {
      id: 'sunflower', name: 'The Sunflower', x: 186, y: 352, w: 90, h: 92,
      lines: () => ['I am facing the wrong way. The sun is painted on the other side.', 'Yellow. I used to be yellow. It was nice.'],
    },
  ],
};
