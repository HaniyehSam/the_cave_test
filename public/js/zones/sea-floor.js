// The Drowned Garden: a flooded cave under the market, full of printed sea creatures.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, label, fill, TONE, random, cave,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

const CAVE = 'M0 640 H50 Q30 380 160 240 Q320 130 500 150 Q760 150 870 280 Q940 420 914 640 H960 V760 H914 Q900 900 480 912 Q80 904 50 760 H0 Z';
const EDGE = 'M0 640 H50 Q30 380 160 240 Q320 130 500 150 Q760 150 870 280 Q940 420 914 640 H960 M960 760 H914 Q900 900 480 912 Q80 904 50 760 H0';

function water() {
  // The water line near the top of the cave, then weeds and rocks on the bottom.
  let s = path('M120 280 Q240 270 360 282 T600 280 T860 284', { 'stroke-width': 1.4 });
  for (let i = 0; i < 18; i++) s += path(`M${100 + i * 46} ${330 + (i % 4) * 90} q8 -4 16 0`, light);
  for (const [x, h, bend] of [[110, 260, 30], [150, 180, -20], [630, 220, 24], [870, 240, -30], [900, 160, 18]]) {
    s += path(`M${x} 880 Q${x + bend} ${880 - h / 2} ${x} ${880 - h} M${x} ${880 - h * 0.3} q${bend} -10 ${bend * 1.3} -30 M${x} ${880 - h * 0.6} q${-bend} -10 ${-bend} -26`, thin);
  }
  s += path('M560 880 Q600 840 660 850 Q700 830 760 870 L770 900 H560 Z', fill.hatch);
  return s;
}

function clam() {
  return path('M150 880 Q148 848 200 840 Q252 848 250 880 Z', fill.white) + path('M160 876 L200 844 L240 876 M176 878 L200 846 L222 878', thin);
}

function diver() {
  // The suit is drawn; the helmet is a real engraving from 1832, glued on.
  let s = path('M446 720 Q440 668 470 660 H530 Q560 668 554 720 L560 800 H440 Z', fill.hatch);
  s += path('M446 690 L416 750 L428 756 M554 690 L584 748 L572 754', { 'stroke-width': 8, stroke: '#292824' }) + path('M446 690 L416 750 M554 690 L584 748', { 'stroke-width': 5.5, stroke: '#fffdf8' });
  s += path('M452 800 L448 870 H476 L482 800 M520 800 L524 870 H552 L548 800', fill.white) + rect(440, 866, 44, 12, fill.ink) + rect(516, 866, 44, 12, fill.ink);
  s += path('M500 600 Q520 520 620 470 Q700 430 760 300', { 'stroke-dasharray': '4 4' });   // air hose to the surface
  return s;
}

function oona() {
  // Oona the octopus, holding a paintbrush she found.
  let s = path('M780 840 Q770 790 800 776 Q834 768 842 806 Q846 830 836 846 Z', fill.white);
  for (const [dx, dir] of [[-18, -1], [-6, -1], [6, 1], [18, 1]]) s += path(`M${810 + dx} 846 q${dir * 10} 20 ${dir * 24} 24 q${dir * 10} 2 ${dir * 6} -10`, thin);
  s += circle(800, 806, 3, fill.ink) + circle(822, 806, 3, fill.ink) + path('M804 820 q7 5 14 0 M842 812 L874 780 M872 774 l8 8', thin);
  return s;
}

const art = () => {
  const r = random(1212);
  return sectionSVG(cave(CAVE, EDGE, r) + water() + clam() + diver() + oona());
};

const colourWash = () => washSVG(
  wash('M60 284 Q240 270 360 282 T600 280 T900 284 V900 H60 Z', COLORS.sea.hex, 0.3) +
  wash('M0 0 H960 V290 H0 Z', COLORS.sand.hex, 0.15) +
  wash('M780 840 Q770 790 800 776 Q834 768 842 806 Q846 830 836 846 Z', COLORS.coral.hex, 0.55) +
  wash('M446 720 Q440 668 470 660 H530 Q560 668 554 720 L560 800 H440 Z', COLORS.marigold.hex, 0.4),
);

const pearl = () => circle(200, 852, 7, fill.white);

function alive(ctx, t, { warmth, has }) {
  // Bubbles from the diver's helmet, always.
  ctx.strokeStyle = 'rgba(41,40,36,0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const k = (t / 3000 + i / 5) % 1;
    ctx.beginPath();
    ctx.arc(512 + Math.sin(k * 9 + i) * 8, 580 - k * 290, 3 + k * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (warmth > 0.2) {      // a little school of fish
    for (let i = 0; i < 6; i++) {
      const x = ((t / 30 + i * 40) % 1100) - 70, y = 420 + Math.sin(t / 900 + i) * 30 + (i % 3) * 22;
      ctx.fillStyle = i % 2 ? COLORS.marigold.hex : COLORS.coral.hex;
      ctx.beginPath();
      ctx.ellipse(x, y, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.moveTo(x - 9, y);
      ctx.lineTo(x - 17, y - 5);
      ctx.lineTo(x - 17, y + 5);
      ctx.fill();
    }
  }
  if (has('clam')) {       // the clam breathes open and shut around its pearl
    const open = (Math.sin(t / 900) + 1) / 2;
    ctx.fillStyle = '#fffdf8';
    ctx.strokeStyle = '#292824';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(150, 846);
    ctx.quadraticCurveTo(200, 800 - open * 30, 250, 846);
    ctx.quadraticCurveTo(200, 826 - open * 18, 150, 846);
    ctx.fill();
    ctx.stroke();
  }
}

export default {
  id: 'seafloor',
  name: 'The Drowned Garden',
  col: 1,
  row: 1,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'jellyfish', x: 280, y: 450, h: 190, rotate: -4, tape: 0 },
    { src: 'anemones', x: 690, y: 690, h: 150, rotate: 3, tape: 0 },
    { src: 'starfish', x: 330, y: 820, h: 100, rotate: -8, tape: 0 },
    { src: 'diving-helmet', x: 500, y: 604, h: 124, rotate: 0, tape: 0 },
  ],
  finds: [{ id: 'pattern:scales', x: 600, y: 836, clue: 'among the rocks' }],
  secrets: [{ id: 'clam', x: 200, y: 864, r: 30, amount: 40, reveal: pearl, say: 'The giant clam opens. There is a pearl inside!' }],
  residents: [
    {
      id: 'oona', name: 'Oona', x: 810, y: 846, w: 70, h: 80,
      lines: ({ has, warmth }) => [
        ...(has('clam') ? ['The clam opened for you! It never opens for me.'] : ['That clam has been sulking for years. Paint might cheer it up.']),
        ...(warmth > 0.5 ? ['Look at the fish! I had forgotten fish came in colours.'] : []),
        'I found a paintbrush down here. I have eight arms and nothing to paint.',
      ],
    },
    { id: 'diver', name: 'Mr Bubbles', x: 500, y: 870, w: 80, h: 300, lines: () => ['Blub. (He waves.)', 'Blub blub. (He points at the jellyfish, very impressed.)'] },
  ],
};
