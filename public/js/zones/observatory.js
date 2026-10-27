// The Observatory: a domed tower on a floating rock, with the real Moon, Earth and Saturn for company.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, label, fill, TONE, random,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

function rock() {
  let s = path('M220 650 Q260 630 320 640 H640 Q700 630 740 650 L716 700 L690 760 L640 790 L600 860 L560 820 L520 900 L480 830 L430 880 L400 800 L340 820 L300 760 L250 720 Z', fill.hatch);
  s += path('M220 650 Q480 676 740 650', { 'stroke-width': 2 });
  // Roots dangling from the underside.
  s += path('M440 878 q-10 30 4 50 M520 898 q12 20 0 44 M600 858 q8 26 -6 40 M342 818 q-6 24 6 40', thin);
  return s;
}

function tower() {
  let s = rect(300, 440, 360, 210, fill.white);
  for (let y = 456; y < 650; y += 16) s += path(`M302 ${y} H658`, light);
  // The dome, with its slit open to the sky.
  s += path('M290 440 A190 190 0 0 1 670 440 Z', fill.white) + path('M282 440 H678', { 'stroke-width': 3 });
  s += path('M500 256 L540 262 L560 440 L520 440 Z', fill.ink);
  for (const a of [0.35, 0.6, 0.85]) s += path(`M${(480 - Math.cos(a * Math.PI) * 190).toFixed(0)} 440 Q480 ${(440 - 190 * Math.sin(a * Math.PI) * 1.2).toFixed(0)} ${(480 - Math.cos(a * Math.PI) * 60).toFixed(0)} 270`, light);
  // A cutaway window into the room: the big telescope, a corkboard, a desk.
  s += rect(330, 470, 300, 160, fill.white);
  s += path('M452 600 L486 520 M486 520 L520 600 M486 520 V610', thin);
  s += path('M440 548 L562 400 L582 414 L460 562 Z', fill.white) + path('M556 404 L578 422', { 'stroke-width': 3 });
  s += rect(344, 486, 96, 76, fill.light) + label(350, 576, 'NOTES', { size: 8 });
  s += rect(560, 586, 60, 10, fill.white) + path('M566 596 V630 M614 596 V630', thin);
  // Dr Orbit, wild-haired, peering upwards.
  s += path('M388 630 Q384 590 404 584 Q424 590 422 630 Z', fill.hatch);
  s += circle(404, 570, 11, fill.white) + path('M390 566 q-6 -14 6 -12 q2 -12 12 -6 q8 -8 12 4 q10 0 2 12', thin);
  s += circle(400, 570, 3) + circle(409, 570, 3) + path('M402 578 q3 2 6 0', thin);
  return s;
}

function stars(r) {
  let s = '';
  for (let i = 0; i < 40; i++) {
    const x = r() * 960, y = r() * 600, k = 2 + r() * 4;
    s += path(`M${x.toFixed(0)} ${(y - k).toFixed(0)} v${(2 * k).toFixed(0)} M${(x - k).toFixed(0)} ${y.toFixed(0)} h${(2 * k).toFixed(0)}`, thin);
  }
  return s;
}

const art = () => {
  const r = random(909);
  return sectionSVG(stars(r) + rock() + tower());
};

const colourWash = () => washSVG(
  wash('M0 0 H960 V960 H0 Z', COLORS.midnight.hex, 0.22) +
  wash('M290 440 A190 190 0 0 1 670 440 Z', COLORS.silver.hex, 0.5) +
  wash('M300 440 H660 V650 H300 Z', COLORS.marigold.hex, 0.2) +
  wash('M220 650 L740 650 L600 860 L480 830 L340 820 Z', COLORS.rust.hex, 0.3),
);

const comet = () => path('M760 360 l-80 50', { stroke: '#a39e93', 'stroke-dasharray': '2 6' });

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.1) {      // twinkling
    for (let i = 0; i < 18; i++) {
      const x = (i * 233) % 960, y = (i * 151) % 600, k = (Math.sin(t / 400 + i * 1.3) + 1) / 2;
      ctx.fillStyle = `rgba(240,180,41,${k * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + k * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (has('lens')) {       // shooting stars
    for (let i = 0; i < 2; i++) {
      const k = ((t / 2600) + i * 0.5) % 1, x = 980 - k * 700 - i * 120, y = 60 + k * 260 + i * 80;
      const g = ctx.createLinearGradient(x, y, x + 80, y - 30);
      g.addColorStop(0, `rgba(240,180,41,${1 - k})`);
      g.addColorStop(1, 'rgba(240,180,41,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 80, y - 30);
      ctx.stroke();
    }
  }
}

export default {
  id: 'observatory',
  name: 'The Observatory',
  col: -1,
  row: -1,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'moon', x: 160, y: 190, h: 170, rotate: 0, tape: 0 },
    { src: 'earth', x: 820, y: 560, h: 140, rotate: 0, tape: 0 },
    { src: 'saturn', x: 790, y: 170, h: 120, rotate: -5, tape: 2 },
    { src: 'bootprint', x: 370, y: 520, h: 56, rotate: -4, tape: 1 },
    { src: 'telescope', x: 590, y: 520, h: 70, rotate: 5, tape: 1 },
  ],
  finds: [
    { id: 'color:midnight', x: 590, y: 572, clue: 'on the desk inside' },
    { id: 'pattern:swirls', x: 480, y: 620, hidden: 'lens', clue: 'look through the big telescope' },
  ],
  secrets: [{ id: 'lens', x: 566, y: 410, r: 22, amount: 25, reveal: comet, say: 'Shooting stars, everywhere!' }],
  residents: [
    {
      id: 'orbit', name: 'Dr Orbit', x: 404, y: 630, w: 44, h: 72,
      lines: ({ has }) => has('lens')
        ? ['Meteors! Dozens! Write that down. No, wait, I will.', 'The swirls in the nebula notes are yours to keep.']
        : ['Up here you can see the real Moon. Real Earth too. Look how small Paper Street is.', 'The lens at the end of the telescope is fogged with grey. Colour would clear it.', 'That bootprint on my board is from 1969. Not mine.'],
    },
  ],
};
