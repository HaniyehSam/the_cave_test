// The Midnight Station: an iron train shed, a real steam engine, and a pocket watch for a clock.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, label, fill, TONE, random, groundStrip,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

function shed() {
  // The arched roof of the train shed, its ribs and skylight.
  let s = path('M30 700 V330 Q30 140 480 130 Q930 140 930 330 V700', { 'stroke-width': 3 });
  s += path('M60 700 V340 Q60 172 480 162 Q900 172 900 340 V700', thin);
  for (let i = 1; i < 8; i++) {
    const x = 30 + i * 112.5;
    s += path(`M${x} ${(160 + Math.abs(x - 480) ** 2 / 1300).toFixed(0)} V700`, light);
  }
  s += path('M300 150 Q480 128 660 150', { 'stroke-width': 6, stroke: TONE.hatch });
  // The pocket watch hangs from the roof on a chain.
  s += path('M480 140 V214', { 'stroke-dasharray': '4 3' });
  // Departure board.
  s += rect(140, 300, 220, 92, fill.ink) + label(152, 322, 'PLATFORM ½', { size: 11, fill: '#fffdf8' });
  s += label(152, 346, 'MOONSIDE  00:00', { size: 11, fill: '#fffdf8' }) + label(152, 368, 'ANYWHERE  ??:??', { size: 11, fill: '#fffdf8' });
  s += label(152, 386, 'ON TIME, ISH', { size: 8, fill: '#fffdf8' }) + path('M180 300 V270 M320 300 V270', thin);
  return s;
}

function platform() {
  // A raised platform with herringbone paving, rails beside it.
  let s = rect(30, 620, 900, 22, fill.white) + path('M30 620 H930 M30 642 H930', { 'stroke-width': 2 });
  for (let x = 40; x < 930; x += 18) s += path(`M${x} 622 l9 9 l9 -9 M${x} 640 l9 -9 l9 9`, light);
  s += path('M30 670 H930 M30 682 H930', { 'stroke-width': 1.8 });
  for (let x = 40; x < 930; x += 30) s += rect(x, 664, 18, 24, fill.light);
  // Bench with a sleeping traveller and her suitcase.
  s += path('M640 620 V590 M740 620 V590 M630 590 H750 M636 574 H744 M640 574 V560 M740 574 V560', { 'stroke-width': 2 });
  s += path('M660 588 Q656 556 676 552 Q698 548 704 574 L712 588 Z', fill.hatch) + circle(668, 546, 10, fill.white);
  s += path('M662 546 q4 3 8 0 M672 538 q6 -2 10 4', thin) + label(684, 532, 'z', { size: 10 }) + label(694, 520, 'z', { size: 13 });
  s += rect(760, 584, 54, 36, fill.white) + path('M776 584 v-8 h22 v8 M760 600 h54', thin) + circle(774, 596, 4) + circle(800, 596, 4);
  // Lost luggage trolley.
  s += path('M820 620 V540 M820 540 h20', thin) + rect(830, 588, 80, 30, fill.white) + rect(842, 560, 56, 28, fill.white) + rect(852, 538, 36, 22, fill.hatch);
  s += label(835, 606, 'LOST', { size: 8 }) + circle(840, 622, 6) + circle(900, 622, 6);
  // Stationmaster Heron, with a cap and a lantern.
  s += path('M560 620 V560 M572 620 V560', thin);
  s += path('M548 560 Q546 520 566 510 Q590 516 584 560 Z', fill.white);
  s += path('M566 510 Q556 470 574 448 M574 448 q10 -8 16 0 L620 456 L590 460', fill.white) + circle(582, 450, 1.6, fill.ink);
  s += path('M572 442 h18 l-4 -8 h-12 Z', fill.ink) + path('M590 530 l20 10 v20', thin) + rect(604, 560, 14, 18, fill.white);
  return s;
}

const art = () => {
  const r = random(606);
  return sectionSVG(groundStrip(r, { crossing: 380 }) + shed() + platform());
};

const colourWash = () => washSVG(
  wash('M30 700 V330 Q30 140 480 130 Q930 140 930 330 V700 Z', COLORS.midnight.hex, 0.18) +
  wash('M140 300 H360 V392 H140 Z', COLORS.marigold.hex, 0.3) +
  wash('M30 620 H930 V642 H30 Z', COLORS.rust.hex, 0.45) +
  wash('M660 588 Q656 556 676 552 Q698 548 704 574 L712 588 Z', COLORS.plum.hex, 0.5) +
  wash('M760 584 H814 V620 H760 Z', COLORS.coral.hex, 0.5),
);

const sparkle = () => path('M440 220 l-14 -6 M520 220 l14 -6 M480 300 v14', thin);

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.2) {      // steam from the engine
    for (let i = 0; i < 5; i++) {
      const k = (t / 2600 + i / 5) % 1;
      ctx.strokeStyle = `rgba(41,40,36,${0.45 * (1 - k)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(200 + k * 50 + Math.sin(k * 7 + i) * 8, 520 - k * 160, 8 + k * 22, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (warmth > 0.5) {      // the departure board flickers
    if ((t % 3000) < 90) {
      ctx.fillStyle = 'rgba(240,180,41,0.5)';
      ctx.fillRect(150, 334, 120, 16);
    }
  }
  if (has('clock')) {      // the pocket watch keeps time again
    const sec = t / 1000;
    ctx.strokeStyle = '#292824';
    ctx.lineCap = 'round';
    for (const [len, w, a] of [[26, 2.4, sec / 60], [34, 1.6, sec / 6], [36, 1, sec]]) {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(480, 266);
      ctx.lineTo(480 + Math.sin(a * Math.PI * 2) * len, 266 - Math.cos(a * Math.PI * 2) * len);
      ctx.stroke();
    }
  }
}

export default {
  id: 'station',
  name: 'The Midnight Station',
  col: 3,
  row: 0,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'locomotive', x: 320, y: 600, h: 170, rotate: 0, tape: 0 },
    { src: 'pocket-watch', x: 480, y: 262, h: 110, rotate: 0, tape: 0 },
    { src: 'tall-clock', x: 92, y: 520, h: 196, rotate: 0, tape: 0 },
  ],
  finds: [
    { id: 'pattern:herringbone', x: 470, y: 604, clue: 'underfoot on the platform' },
    { id: 'color:silver', x: 872, y: 520, hidden: 'clock', clue: 'when the clock starts again' },
  ],
  secrets: [{ id: 'clock', x: 480, y: 266, r: 34, amount: 50, reveal: sparkle, say: 'The station clock is ticking again.' }],
  residents: [
    {
      id: 'heron', name: 'Stationmaster Heron', x: 568, y: 620, w: 50, h: 180,
      lines: ({ has }) => has('clock')
        ? ['Tick, tock! Trains can leave on time again. Well, nearly on time.', 'Someone left a silver thing on the luggage trolley. Finders keepers.']
        : ['The clock stopped. Nobody knows what time it is, so the train never leaves.', 'Platform one-half. Do not ask about the other half.'],
    },
    { id: 'bea', name: 'Bea', x: 676, y: 588, w: 60, h: 50, lines: () => ['(Bea is fast asleep.)', 'Mmf… is it Moonside yet?', '(Bea dreams of a red train.)'] },
  ],
};
