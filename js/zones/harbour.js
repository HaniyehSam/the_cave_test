// The Harbour: a drawn sea with a real lighthouse standing in it, a boat, and a patient fisherman.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, label, fill, TONE, random, groundStrip, cloud,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

function sea(r) {
  let s = cloud(80, 120, 160, r) + cloud(420, 80, 110, r);
  // Horizon and the water behind the quay wall.
  s += path('M0 520 H960', { 'stroke-width': 1.2 });
  for (let i = 0; i < 26; i++) {
    const x = (i * 97) % 940 + 10, y = 540 + ((i * 53) % 140);
    s += path(`M${x} ${y} q8 -5 16 0 t16 0`, thin);
  }
  // Rocks the lighthouse stands on (the photo goes on top of them).
  s += path('M660 620 Q690 560 740 580 Q780 548 830 576 Q880 566 900 620 Z', fill.hatch);
  return s;
}

function boat() {
  // A small sailing boat, moored by a rope to the quay.
  let s = path('M300 640 H520 L496 680 H332 Z', fill.white) + path('M310 652 H512', light);
  s += path('M410 640 V470 M410 480 L500 628 H410 M404 490 L330 626 H404', fill.white);
  s += path('M410 470 l16 6 l-16 6', fill.ink) + label(366, 668, 'MAYBE', { size: 9, spacing: 2 });
  s += path('M332 660 Q300 690 260 700', thin);
  return s;
}

function quay() {
  let s = rect(0, 690, 960, 10, fill.hatch);
  // Harbourmaster's hut with a noticeboard.
  s += path('M40 690 V500 L140 450 L240 500 V690', fill.white) + path('M30 502 L140 446 L250 502', { 'stroke-width': 2.6 });
  for (let y = 520; y < 690; y += 14) s += path(`M42 ${y} H238`, light);
  s += rect(66, 520, 150, 112, fill.white) + label(80, 652, 'HARBOURMASTER', { size: 8 }) + rect(94, 640, 40, 50, fill.white);
  // Bollards, a coil of rope and crates.
  for (const x of [262, 560, 620]) s += path(`M${x - 10} 690 V672 Q${x - 10} 662 ${x} 662 Q${x + 10} 662 ${x + 10} 672 V690`, fill.white);
  s += ellipse(600, 684, 26, 7, fill.white) + ellipse(600, 680, 18, 5) + ellipse(600, 676, 10, 3);
  s += rect(860, 640, 50, 50, fill.white) + rect(900, 610, 44, 80, fill.white) + path('M860 665 h50 M900 650 h44', light);
  // Captain Brine on a bollard, fishing off the edge.
  s += path('M552 650 Q560 618 572 616 Q586 618 586 650 Z', fill.hatch) + circle(570, 604, 11, fill.white);
  s += path('M556 600 Q570 584 584 600 Z', fill.ink) + path('M566 610 q4 4 9 0 M560 616 q10 12 20 0', thin);
  s += path('M584 630 L660 560 M660 560 Q676 600 664 660', thin) + circle(664, 662, 3);
  return s;
}

const art = () => {
  const r = random(505);
  return sectionSVG(groundStrip(r, { manhole: 120 }) + sea(r) + boat() + quay());
};

const colourWash = () => washSVG(
  wash('M0 0 H960 V520 H0 Z', COLORS.pond.hex, 0.25) +
  wash('M0 520 H960 V690 H0 Z', COLORS.sea.hex, 0.4) +
  wash('M410 480 L500 628 H410 Z', COLORS.coral.hex, 0.4) +
  wash('M300 640 H520 L496 680 H332 Z', COLORS.sand.hex, 0.5) +
  wash('M40 690 V500 L140 450 L240 500 V690 Z', COLORS.teal.hex, 0.25),
);

const beam = () => path('M794 314 L960 264 M794 314 L960 364', { stroke: '#a39e93', 'stroke-dasharray': '3 6' });

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.1) {      // the water moves
    ctx.strokeStyle = '#29282455';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const x = ((i * 113 + t / 40) % 1000) - 20, y = 560 + i * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 8, y - 5, x + 16, y);
      ctx.stroke();
    }
  }
  if (warmth > 0.3) {      // gulls
    ctx.strokeStyle = '#292824';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      const x = (t / (28 + i * 6) + i * 300) % 1000 - 20, y = 180 + i * 50 + Math.sin(t / 700 + i) * 18, f = Math.sin(t / 160 + i) * 5;
      ctx.beginPath();
      ctx.moveTo(x - 12, y - f);
      ctx.quadraticCurveTo(x - 6, y - 8, x, y);
      ctx.quadraticCurveTo(x + 6, y - 8, x + 12, y - f);
      ctx.stroke();
    }
  }
  // A buoy that bobs in any weather.
  const bob = Math.sin(t / 600) * 3;
  ctx.fillStyle = has('lamp') ? COLORS.lantern.hex : '#fffdf8';
  ctx.strokeStyle = '#292824';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(586, 600 + bob);
  ctx.lineTo(598, 572 + bob);
  ctx.lineTo(610, 600 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (has('lamp')) {       // the lighthouse sweeps the sea
    const a = Math.sin(t / 1400) * 0.5;
    const g = ctx.createLinearGradient(794, 314, 794 - Math.cos(a) * 300, 314 + Math.sin(a) * 300);
    g.addColorStop(0, 'rgba(240,180,41,0.45)');
    g.addColorStop(1, 'rgba(240,180,41,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(794, 314);
    ctx.lineTo(794 - Math.cos(a - 0.12) * 320, 314 + Math.sin(a - 0.12) * 320);
    ctx.lineTo(794 - Math.cos(a + 0.12) * 320, 314 + Math.sin(a + 0.12) * 320);
    ctx.fill();
  }
}

export default {
  id: 'harbour',
  name: 'The Harbour',
  col: 2,
  row: 0,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'lighthouse', x: 772, y: 440, h: 300, rotate: 1, tape: 2 },
    { src: 'shell-plate', x: 141, y: 576, h: 104, rotate: -2, tape: 2 },
  ],
  finds: [
    { id: 'color:sea', x: 470, y: 624, clue: 'aboard the boat' },
    { id: 'color:sand', x: 820, y: 676, hidden: 'lamp', clue: 'the lighthouse is dark' },
  ],
  secrets: [{ id: 'lamp', x: 794, y: 314, r: 28, amount: 30, reveal: beam, say: 'The lighthouse is lit!' }],
  residents: [
    {
      id: 'brine', name: 'Captain Brine', x: 570, y: 650, w: 44, h: 60,
      lines: ({ has }) => has('lamp')
        ? ['Now that is a light. Boats will find their way home again.', 'Caught nothing. Lovely day for it.']
        : ['The lighthouse went dark the day the colour left. Its lamp is right at the top.', 'That poster in the hut tells you every shell on the beach. I have never read it.'],
    },
  ],
};
