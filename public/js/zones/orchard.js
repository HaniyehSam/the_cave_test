// The Cloud Orchard: fruit trees rooted in a cloud, hung with real fruit paintings.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, label, fill, TONE, random, cloud,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

const CANOPIES = {
  apple: 'M150 470 Q120 420 160 392 Q160 336 220 340 Q256 300 300 336 Q352 330 360 380 Q396 420 360 466 Q330 500 280 488 Q230 510 190 492 Q150 500 150 470 Z',
  pear: 'M420 440 Q392 380 440 352 Q446 290 512 300 Q560 260 600 304 Q650 316 644 372 Q676 420 630 460 Q590 494 530 478 Q470 500 440 474 Q412 470 420 440 Z',
  cherry: 'M680 470 Q650 420 690 396 Q692 344 748 350 Q790 320 826 360 Q872 372 862 420 Q884 466 840 486 Q800 508 760 492 Q714 504 690 488 Z',
};

function island() {
  let s = path('M90 690 Q70 650 120 640 Q140 600 200 620 Q250 590 310 616 Q380 594 440 618 Q510 592 580 616 Q650 596 700 620 Q770 600 820 630 Q880 630 880 676 Q900 720 850 738 Q790 780 700 760 Q600 790 500 764 Q400 790 300 762 Q200 786 140 752 Q80 740 90 690 Z', fill.white);
  s += path('M160 730 q30 10 60 0 M420 760 q40 10 80 0 M720 740 q30 10 60 0', light);
  // A rope ladder dangling down towards the market.
  s += path('M846 740 Q850 850 840 960 M876 736 Q880 850 872 960', thin);
  for (let y = 770; y < 960; y += 26) s += path(`M${846 + (y - 740) * -0.03} ${y} H${876 + (y - 740) * -0.02}`, thin);
  return s;
}

function trees() {
  let s = '';
  for (const [x, top] of [[256, 480], [532, 470], [772, 486]]) s += path(`M${x - 8} 634 Q${x - 4} 560 ${x - 2} ${top} M${x + 8} 634 Q${x + 6} 560 ${x + 4} ${top} M${x} 560 L${x + 30} 520 M${x} 580 L${x - 34} 540`, { 'stroke-width': 2 });
  s += path(CANOPIES.apple, fill.white) + path(CANOPIES.pear, fill.white) + path(CANOPIES.cherry, fill.dots);
  s += path('M190 410 q10 -8 20 0 M300 380 q10 -8 20 0 M480 350 q10 -8 20 0 M600 400 q10 -8 20 0 M560 330 q10 -8 20 0', thin);
  // A ladder against the pear tree and a basket of windfalls.
  s += path('M600 634 L640 450 M630 634 L668 452', thin);
  for (let i = 0; i < 6; i++) s += path(`M${604 + i * 6.6} ${614 - i * 30} H${634 + i * 6.4}`, thin);
  s += path('M392 632 L398 600 H446 L452 632 Z', fill.hatch) + path('M398 600 Q422 570 446 600', thin);
  for (const [x, y] of [[408, 596], [424, 592], [438, 596]]) s += circle(x, y, 8, fill.white);
  return s;
}

function folk() {
  // Ms Bramble in a sun hat, and Nimbus, a sheep made of cloud.
  let s = path('M686 640 Q684 596 704 590 Q726 596 724 640 Z', fill.hatch) + circle(704, 578, 11, fill.white);
  s += ellipse(704, 568, 24, 5, fill.white) + path('M694 568 q10 -16 20 0', fill.white) + path('M699 580 h1 M708 580 h1 M700 586 q4 3 8 0', thin);
  s += path('M332 640 v14 M360 640 v14', thin);
  s += path('M320 640 Q300 630 316 614 Q316 596 336 600 Q348 586 362 600 Q380 598 378 616 Q392 630 372 642 Z', fill.white);
  s += ellipse(312, 618, 9, 7, fill.ink) + circle(309, 616, 1.4, fill.white);
  return s;
}

const art = () => {
  const r = random(808);
  return sectionSVG(cloud(80, 160, 140, r) + cloud(640, 120, 170, r) + cloud(400, 230, 90, r) + island() + trees() + folk());
};

const colourWash = () => washSVG(
  wash('M0 0 H960 V960 H0 Z', COLORS.blush.hex, 0.12) +
  wash(CANOPIES.apple, COLORS.moss.hex, 0.45) +
  wash(CANOPIES.pear, COLORS.mint.hex, 0.45) +
  wash(CANOPIES.cherry, COLORS.blush.hex, 0.55) +
  wash('M686 640 Q684 596 704 590 Q726 596 724 640 Z', COLORS.plum.hex, 0.5),
);

const blossom = () => path('M700 380 l6 -6 M760 360 l6 -6 M820 400 l6 -6 M730 450 l6 -6', thin);

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.25) {     // bees drifting between the trees
    for (let i = 0; i < 4; i++) {
      const a = t / (900 + i * 160) + i * 1.7, x = 500 + Math.cos(a) * (300 - i * 40), y = 430 + Math.sin(a * 2) * 50;
      ctx.fillStyle = COLORS.marigold.hex;
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(x - 1, y - 4, 3, 2 + Math.abs(Math.sin(t / 50)) * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Nimbus bobs gently, always.
  ctx.strokeStyle = 'rgba(41,40,36,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(346, 596 + Math.sin(t / 700) * 2, 14, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  if (has('blossom')) {    // petals tumbling from the cherry tree
    for (let i = 0; i < 12; i++) {
      const k = (t / 6000 + i / 12) % 1;
      ctx.fillStyle = i % 3 ? COLORS.blush.hex : '#fffdf8';
      ctx.save();
      ctx.translate(690 + ((i * 47) % 170) + Math.sin(k * 8 + i) * 20, 400 + k * 420);
      ctx.rotate(k * 10 + i);
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export default {
  id: 'orchard',
  name: 'The Cloud Orchard',
  col: 1,
  row: -1,
  art,
  wash: colourWash,
  alive,
  photos: [
    { src: 'apple-yellow', x: 252, y: 430, h: 92, rotate: -5, tape: 1 },
    { src: 'pear-big', x: 540, y: 418, h: 104, rotate: 4, tape: 1 },
    { src: 'cherry-branch', x: 770, y: 426, h: 104, rotate: -3, tape: 1 },
    { src: 'wild-turkey', x: 150, y: 584, h: 122, rotate: 0, tape: 2 },
  ],
  finds: [
    { id: 'color:plum', x: 470, y: 612, clue: 'by the basket of windfalls' },
    { id: 'pattern:confetti', x: 800, y: 620, hidden: 'blossom', clue: 'wake the cherry tree' },
  ],
  secrets: [{ id: 'blossom', x: 760, y: 420, r: 60, amount: 120, reveal: blossom, say: 'The cherry tree bursts into blossom!' }],
  residents: [
    {
      id: 'bramble', name: 'Ms Bramble', x: 704, y: 640, w: 44, h: 76,
      lines: ({ has }) => has('blossom')
        ? ['Blossom in the clouds! The bees will be beside themselves.', 'Take a handful of confetti. We have plenty.']
        : ['Everything grows up here. Even pictures of fruit, apparently.', 'The cherry tree has been asleep for ages. Give it some colour, would you?'],
    },
    { id: 'nimbus', name: 'Nimbus', x: 346, y: 642, w: 70, h: 50, lines: () => ['Baa. (It sounds like distant thunder.)', '(Nimbus is slightly damp.)'] },
    { id: 'turkey', name: 'The Turkey', x: 150, y: 640, w: 70, h: 120, lines: () => ['Gobble. I have no idea how I got up here either.', 'I was painted in 1820-something. Very flattering.'] },
  ],
};
