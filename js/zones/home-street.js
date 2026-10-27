// Paper Street: where every visit starts. A cutaway house, a café, and a cat.
import { COLORS } from '../config.js';
import {
  sectionSVG, washSVG, wash, path, rect, circle, ellipse, at, label, fill, TONE, random, groundStrip, cloud,
} from '../svg.js';

const thin = { 'stroke-width': 1 };
const light = { stroke: TONE.hatch, 'stroke-width': 1 };

function house() {
  let s = '';
  // Chimney sits behind the roof.
  s += rect(326, 150, 32, 84, fill.cross) + rect(320, 140, 44, 12, fill.white);
  // Attic wallpaper, then the roof as a thick tiled band.
  s += path('M62 296 L240 172 L418 296 Z', fill.dots);
  s += path('M20 302 L240 148 L460 302 Z M62 296 L418 296 L240 172 Z', { fill: 'url(#cross)', 'fill-rule': 'evenodd', 'stroke-width': 2.6 });
  // Round attic window: paint it to see the stars.
  s += circle(240, 228, 24, fill.white) + circle(240, 228, 18) + path('M222 228 H258 M240 210 V246', thin);
  // Walls, floors and the middle wall (with a doorway downstairs).
  s += rect(44, 296, 392, 10, fill.hatch) + rect(44, 496, 392, 10, fill.hatch);
  s += rect(44, 306, 12, 394, fill.hatch) + rect(424, 306, 12, 394, fill.hatch);
  s += rect(234, 306, 8, 190, fill.hatch) + rect(234, 506, 8, 70, fill.hatch);
  // Back walls of the four rooms.
  s += rect(56, 306, 178, 190, fill.white) + rect(242, 306, 182, 190, fill.dots);
  s += rect(56, 506, 178, 194, fill.white) + rect(242, 506, 182, 194, fill.white);
  for (let x = 252; x < 424; x += 14) s += path(`M${x} 507 V699`, light);
  for (let y = 420; y < 496; y += 12) s += path(`M57 ${y} H233`, light);
  for (let x = 66; x < 234; x += 12) s += path(`M${x} 420 V495`, light);
  return s;
}

function attic() {
  let s = '';
  // Telescope on a tripod, aimed at the round window.
  s += path('M168 294 L180 262 L192 294 M180 262 V292', thin);
  s += at(180, 258, rect(-26, -6, 44, 12, fill.white) + rect(18, -8, 10, 16, fill.white), { rotate: -18 });
  // Boxes, a lampshade and a rolled-up rug.
  s += rect(296, 256, 50, 38, fill.white) + path('M296 268 H346 M321 256 V268', thin);
  s += rect(330, 230, 44, 26, fill.white) + label(336, 247, 'MISC', { size: 8 });
  s += rect(352, 262, 48, 32, fill.hatch);
  // Pip, asleep on an old cushion.
  s += ellipse(108, 290, 34, 6, fill.light);
  s += path('M84 288 Q86 266 106 266 Q122 262 130 276 L134 266 L138 280 Q142 290 128 290 Z', fill.white);
  s += path('M96 286 Q108 296 124 288 M118 278 q3 2 6 0', thin);
  return s;
}

function bathroom() {
  let s = '';
  s += rect(78, 326, 60, 64, fill.white) + path('M108 326 V390 M78 358 H138', thin);
  s += path('M72 322 H144 M74 322 Q84 360 76 394 M142 322 Q132 360 140 394', thin); // curtains
  s += path('M196 330 v8', thin) + circle(196, 330, 2, fill.ink); // a nail where the mirror hangs
  // Claw-foot bath with a heap of bubbles.
  s += path('M80 446 H214 Q212 482 182 484 H112 Q82 482 80 446 Z', fill.white);
  s += path('M92 484 l-6 10 M202 484 l6 10 M204 446 V420 Q204 410 194 410 L190 416', thin);
  for (const [x, y, r] of [[110, 440, 10], [128, 434, 13], [150, 440, 9], [166, 436, 11], [138, 424, 7]]) s += circle(x, y, r, fill.white);
  s += circle(178, 418, 4) + circle(188, 404, 3);
  return s;
}

function bedroom() {
  let s = '';
  // The empty frame. Paint inside it and someone appears.
  s += rect(262, 334, 84, 66, fill.white) + rect(270, 342, 68, 50, { 'stroke-dasharray': '2 5', stroke: '#8f8a7e' });
  s += path('M304 334 L304 324 L294 334 M304 324 L314 334', thin);
  // Bedside table and lamp.
  s += rect(254, 456, 36, 38, fill.white) + path('M262 456 V440 M252 440 h20 l-4 -18 h-12 Z', thin);
  // Bed with a quilt.
  s += path('M410 418 V494 M300 494 V470 H410', { 'stroke-width': 2 });
  s += rect(380, 440, 26, 18, fill.white);
  s += path('M300 470 Q306 452 330 456 H404 V494 H304 Z', fill.hatch);
  s += path('M330 456 V494 M366 456 V494', light);
  return s;
}

function kitchen() {
  let s = '';
  // Window with herbs on the sill.
  s += rect(82, 530, 74, 56, fill.white) + path('M119 530 V586 M82 558 H156 M76 590 H162', thin);
  for (const x of [94, 118, 142]) s += path(`M${x - 7} 590 h14 l-2 -12 h-10 Z M${x} 578 q-8 -12 0 -18 q8 6 0 18`, fill.white);
  // Shelf of jars.
  s += path('M168 548 H228', { 'stroke-width': 2 });
  for (const [x, h] of [[174, 18], [192, 26], [212, 14]]) s += rect(x, 548 - h, 12, h, fill.white);
  // Counter, sink and stove with a kettle.
  s += rect(58, 618, 140, 80, fill.white) + path('M58 628 H198 M104 628 V698 M150 628 V698 M94 660 h4 M140 660 h4 M186 660 h4', thin);
  s += path('M70 618 q20 10 34 0 M86 618 V604 q0 -8 8 -8 h4', thin);
  s += path('M162 604 q2 -16 18 -16 q16 0 18 16 Z M180 588 v-6 M198 598 q12 -2 10 -14', fill.white);
  return s;
}

function livingRoom() {
  let s = '';
  // A wall clock that stopped at ten to two.
  s += circle(392, 552, 18, fill.white) + path('M392 552 L382 544 M392 552 L398 538', thin);
  // Floor lamp.
  s += path('M260 698 V586 M248 698 h24 M244 586 h32 l-8 -22 h-16 Z', fill.white);
  // Armchair.
  s += path('M280 664 V610 Q280 596 296 596 H344 Q360 596 360 610 V664', fill.white);
  s += path('M268 690 V640 Q268 630 280 630 Q290 630 290 640 V690 Z M350 690 V640 Q350 630 360 630 Q372 630 372 640 V690 Z', fill.white);
  s += rect(288, 664, 64, 22, fill.white) + path('M274 690 v8 M366 690 v8', thin);
  // Mrs Ondine, knitting something enormous.
  s += path('M302 622 Q320 612 338 622 L344 666 H296 Z', fill.hatch);
  s += circle(320, 598, 13, fill.white) + circle(320, 581, 7, fill.white);
  s += circle(315, 598, 3.4) + circle(326, 598, 3.4) + path('M318.4 598 h4 M315 606 q5 4 10 0', thin);
  s += path('M306 640 L334 652 M334 640 L306 652', { 'stroke-width': 1.2 });
  s += path('M308 648 h24 v16 h-24 Z', fill.white) + path('M312 652 h16 M312 658 h16', light);
  s += path('M306 666 v18 h-8 M334 666 v18 h8', thin);
  s += circle(388, 690, 8, fill.white) + path('M332 660 Q360 700 382 688 M384 684 l8 8 M382 692 l9 -5', thin);
  // Record player on a low cabinet.
  s += rect(376, 648, 44, 50, fill.white) + path('M376 672 H420 M398 672 V698', thin);
  s += rect(374, 638, 48, 10, fill.white) + ellipse(394, 638, 16, 4, fill.ink) + path('M414 630 l-8 8', thin);
  return s;
}

function cafe() {
  let s = '';
  // Upstairs flat: three windows, the middle one with a little balcony.
  s += rect(570, 330, 360, 160, fill.white) + path('M562 330 H938', { 'stroke-width': 3 });
  for (let y = 346; y < 488; y += 16) for (let x = 574 + ((y / 16) % 2) * 18; x < 926; x += 36) s += path(`M${x} ${y} h26`, light);
  for (const x of [596, 716, 836]) s += rect(x, 362, 62, 82, fill.white) + path(`M${x + 31} 362 V444 M${x} 400 H${x + 62}`, thin);
  s += path('M706 444 H788 V470 H706 Z M716 444 V470 M732 444 V470 M748 444 V470 M764 444 V470 M780 444 V470', thin);
  s += path('M600 444 h54 v10 h-54 Z M608 444 q-4 -14 6 -18 M626 444 q0 -18 8 -20 M644 444 q4 -12 -4 -16', thin);
  // Antenna whose wire runs on to the market next door.
  s += path('M890 330 V244 M878 258 h24 M882 270 h16', thin);
  // Sign, striped awning, shop window and door.
  s += rect(570, 490, 360, 210, fill.white) + rect(580, 492, 340, 28, fill.white) + label(750, 512, 'THE PAPER CUP', { size: 14, anchor: 'middle', spacing: 4 });
  s += path('M576 524 H924 L916 560 Q904 572 892 560 Q880 572 868 560 Q856 572 844 560 Q832 572 820 560 Q808 572 796 560 Q784 572 772 560 Q760 572 748 560 Q736 572 724 560 Q712 572 700 560 Q688 572 676 560 Q664 572 652 560 Q640 572 628 560 Q616 572 604 560 Q592 572 584 560 Z', fill.white);
  for (let x = 604; x < 916; x += 48) s += path(`M${x} 524 V560`, thin);
  s += rect(592, 576, 170, 116, fill.white) + path('M600 590 l20 -10 M600 606 l40 -22', light);
  // Theo behind the counter, with the coffee machine and a cake.
  s += path('M664 652 Q664 626 680 624 Q696 626 696 652', fill.white) + circle(680, 608, 12, fill.white);
  s += path('M668 600 Q672 588 690 594 Q694 600 692 604 M676 610 h1 M684 610 h1 M676 616 q4 3 8 0 M672 636 h16 v16', thin);
  s += rect(612, 616, 36, 36, fill.white) + path('M620 652 v-12 h20 v12 M630 616 v-8', thin);
  s += rect(592, 652, 170, 40, fill.light);
  s += rect(782, 578, 60, 120, fill.white) + circle(812, 612, 14) + circle(832, 650, 3, fill.ink);
  // Chalkboard sign on the pavement.
  s += path('M866 698 L878 620 H916 L928 698 M872 662 h50', fill.white) + label(880, 644, 'TODAY:', { size: 8, spacing: 1 }) + label(880, 656, 'colour', { size: 9, serif: true, spacing: 0 });
  return s;
}

function street(r) {
  let s = '';
  // Street tree with a bicycle leaning on it.
  s += path('M498 700 Q492 610 500 540 M500 590 L530 560 M498 610 L470 584', { 'stroke-width': 2.4 });
  s += path('M440 530 Q430 482 466 470 Q470 430 512 438 Q540 420 556 452 Q584 466 568 500 Q576 532 544 538 Q520 556 496 540 Q470 552 440 530 Z', fill.white);
  s += path('M470 500 q10 -8 20 0 M520 470 q8 6 18 2 M500 520 q10 -6 18 2', thin);
  s += circle(462, 680, 20) + circle(528, 680, 20) + path('M462 680 L484 652 L506 680 Z M506 680 L520 650 L484 652 M520 650 l8 30 M520 650 l-2 -10 h10 M484 652 l-4 -8 h-10', thin);
  // Lamppost with a little hood.
  s += path('M554 700 V500 M546 700 h16 M554 500 q0 -14 14 -14 M560 486 h16 l-4 10 h-8 Z', { 'stroke-width': 1.8 });
  // Sky: clouds and a crescent moon.
  s += cloud(40, 96, 130, r) + cloud(560, 150, 170, r) + path('M820 70 a26 26 0 1 0 22 40 a20 20 0 1 1 -22 -40 Z', fill.white);
  // The wire to the market lanterns.
  s += path('M890 250 Q925 262 960 262', thin);
  s += groundStrip(r, { manhole: 300, crossing: 690 });
  return s;
}

const art = () => {
  const r = random(101);
  return sectionSVG(street(r) + house() + attic() + bathroom() + bedroom() + kitchen() + livingRoom() + cafe());
};

const colourWash = () => washSVG(
  wash('M0 0 H960 V300 L460 300 L240 148 L20 300 H0 Z', COLORS.pond.hex, 0.22) +
  wash('M20 302 L240 148 L460 302 Z', COLORS.coral.hex, 0.4) +
  wash('M56 306 H234 V496 H56 Z', COLORS.teal.hex, 0.18) +
  wash('M242 306 H424 V496 H242 Z', COLORS.blush.hex, 0.3) +
  wash('M56 506 H234 V700 H56 Z', COLORS.marigold.hex, 0.25) +
  wash('M242 506 H424 V700 H242 Z', COLORS.coral.hex, 0.2) +
  wash('M440 530 Q430 482 466 470 Q470 430 512 438 Q540 420 556 452 Q584 466 568 500 Q576 532 544 538 Q520 556 496 540 Q470 552 440 530 Z', COLORS.moss.hex, 0.5) +
  wash('M570 330 H930 V490 H570 Z', COLORS.coral.hex, 0.22) +
  wash('M592 576 H762 V692 H592 Z', COLORS.marigold.hex, 0.4) +
  wash('M0 850 H960 V960 H0 Z', COLORS.marigold.hex, 0.18),
);

// ---------- Secrets ----------

const portrait = () => at(304, 367,
  circle(0, -2, 13, fill.white) + path('M-17 -12 Q0 -26 17 -12 L12 -12 Q0 -18 -12 -12 Z', fill.ink) +
  path('M-5 -4 h1 M5 -4 h1 M-5 4 q5 4 10 0 M-22 24 Q0 6 22 24', { 'stroke-width': 1.3 }));
const stars = () => {
  let s = '';
  const pts = [[110, 54], [160, 34], [214, 62], [270, 42], [330, 70], [392, 40]];
  s += path('M' + pts.map((p) => p.join(' ')).join(' L'), { 'stroke-dasharray': '2 5', stroke: '#8f8a7e' });
  for (const [x, y] of pts) s += path(`M${x} ${y - 8} L${x + 2} ${y - 2} L${x + 8} ${y} L${x + 2} ${y + 2} L${x} ${y + 8} L${x - 2} ${y + 2} L${x - 8} ${y} L${x - 2} ${y - 2} Z`, fill.white);
  return s;
};
const lights = () => {
  let s = path('M576 528 Q680 548 750 530 Q840 548 924 528', thin);
  for (let i = 0; i < 12; i++) s += circle(590 + i * 29, 536 + Math.sin(i * 1.3) * 5, 4, fill.white);
  return s + rect(796, 594, 32, 14, fill.white) + label(812, 605, 'OPEN', { size: 8, anchor: 'middle', spacing: 1 });
};

// ---------- Life ----------

function alive(ctx, t, { warmth, has }) {
  if (warmth > 0.2) {   // chimney smoke
    ctx.strokeStyle = '#29282466';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      const k = ((t / 2600 + i / 5) % 1), y = 134 - k * 110, x = 342 + Math.sin(k * 6 + i) * 10 + k * 26;
      ctx.beginPath();
      ctx.arc(x, y, 5 + k * 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (warmth > 0.15) {  // Pip's tail
    ctx.strokeStyle = '#292824';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(84, 286);
    ctx.quadraticCurveTo(70, 280 + Math.sin(t / 400) * 6, 66, 268 + Math.sin(t / 400) * 8);
    ctx.stroke();
  }
  if (warmth > 0.45) {  // birds on the wire
    for (let i = 0; i < 3; i++) {
      const x = 906 + i * 18, hop = Math.max(0, Math.sin(t / 700 + i * 2.1)) ** 8 * 8;
      const y = 252 + ((x - 890) / 70) ** 2 * 6 - hop;
      ctx.fillStyle = '#292824';
      ctx.beginPath();
      ctx.ellipse(x, y - 5, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.arc(x + 5, y - 9, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (has('record')) {  // music
    ctx.fillStyle = '#292824';
    ctx.font = '18px Georgia, serif';
    for (let i = 0; i < 3; i++) {
      const k = (t / 3000 + i / 3) % 1;
      ctx.globalAlpha = 1 - k;
      ctx.fillText(i % 2 ? '♪' : '♫', 392 + Math.sin(k * 7 + i) * 14 - k * 40, 626 - k * 90);
    }
    ctx.globalAlpha = 1;
  }
  if (has('awning')) {  // café lights and steam
    for (let i = 0; i < 12; i++) {
      const on = (Math.sin(t / 500 + i * 1.7) + 1) / 2;
      ctx.fillStyle = `rgba(240,180,41,${0.35 + on * 0.5})`;
      ctx.beginPath();
      ctx.arc(590 + i * 29, 536 + Math.sin(i * 1.3) * 5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (warmth > 0.6) {   // leaves drifting from the street tree
    for (let i = 0; i < 4; i++) {
      const k = (t / 5000 + i / 4) % 1;
      ctx.fillStyle = i % 2 ? COLORS.coral.hex : COLORS.marigold.hex;
      ctx.save();
      ctx.translate(460 + i * 30 + Math.sin(k * 9 + i) * 18, 520 + k * 180);
      ctx.rotate(k * 9);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export default {
  id: 'home',
  name: 'Paper Street',
  col: 0,
  row: 0,
  art,
  wash: colourWash,
  alive,
  photos: [{ src: 'teapot-blue', x: 738, y: 628, h: 46, rotate: 2, tape: 0 }],
  finds: [
    { id: 'color:coral', x: 352, y: 216, clue: 'up in the attic' },
    { id: 'tool:fill', x: 214, y: 680, clue: 'in the kitchen' },
    { id: 'mod:mirror', x: 196, y: 362, clue: 'in the bathroom' },
    { id: 'color:blush', x: 272, y: 426, hidden: 'portrait', clue: 'someone is missing' },
    { id: 'pattern:stars', x: 200, y: 236, hidden: 'window', clue: 'look up' },
  ],
  secrets: [
    { id: 'portrait', x: 304, y: 367, r: 30, amount: 40, reveal: portrait, say: 'Someone was waiting in that frame.' },
    { id: 'window', x: 240, y: 228, r: 20, amount: 30, reveal: stars, say: 'Stars came out over the roof.' },
    { id: 'record', x: 394, y: 638, r: 18, amount: 20, reveal: () => '', say: 'The record player starts to spin.' },
    { id: 'awning', x: 750, y: 542, r: 60, amount: 140, reveal: lights, say: 'The Paper Cup is open!' },
  ],
  residents: [
    {
      id: 'ondine', name: 'Mrs Ondine', x: 320, y: 690, w: 80, h: 110,
      lines: ({ warmth, has }) => [
        ...(has('record') ? ['My old record! I have not danced since 1974.'] : []),
        ...(warmth > 0.5 ? ['Listen to that. The street is humming again.', 'Have you been to the market next door? Lanterns, dear. Lanterns.'] : []),
        'Oh! A new neighbour with a pencil. Our street has gone ever so pale.',
        'Paint anything you like. Things round here wake up when they get some colour.',
        'I lost my good paint tin. Kitchen, maybe? My knees do not do kitchens.',
      ],
    },
    {
      id: 'pip', name: 'Pip', x: 108, y: 292, w: 60, h: 34,
      lines: () => ['Mrrp.', '(Pip stares very hard at the round window.)', '(Pip purrs. The smell of paint makes her sleepy.)'],
    },
    {
      id: 'theo', name: 'Theo', x: 680, y: 650, w: 50, h: 56,
      lines: ({ has }) => has('awning')
        ? ['On the house. The cup is paper, the coffee is imaginary.', 'Thank you for the awning. It looks like a birthday.']
        : ['Morning! Well, it is always morning in here.', 'The awning used to be stripy. Coral, I think. Before everything went grey.'],
    },
  ],
};
