// The Painted Cave: an old cave whose story wall has gone blank. Draw each slab, say what
// you drew, and Old Ochre tells the story on, with your words in it.
import { COLORS } from '../config.js';
import { sectionSVG, washSVG, wash, path, circle, ellipse, label, fill, TONE, random, cave, sketchRect } from '../svg.js';

const thin = { 'stroke-width': 1 };
const faint = { stroke: TONE.hatch, 'stroke-width': 1.4 };

const CAVE = 'M0 640 H40 Q20 360 140 220 Q300 110 520 130 Q790 140 890 300 Q950 440 920 640 H960 V760 H920 Q900 900 480 908 Q70 900 40 760 H0 Z';
const EDGE = 'M0 640 H40 Q20 360 140 220 Q300 110 520 130 Q790 140 890 300 Q950 440 920 640 H960 M960 760 H920 Q900 900 480 908 Q70 900 40 760 H0';
const FIRE = [600, 858];

// The five slabs, in the order the story is told. Each is a box to draw in.
const PANELS = [
  { x: 110, y: 262, text: 'Long ago, {a} lived in this cave.', react: 'A {w}! Yes… I remember the {w} now. It drew on these walls before anyone.', anim: 'bob' },
  { x: 388, y: 196, text: 'Its best friend in the whole world was {a}.', react: 'Of course, the {w}. They were never apart.', anim: 'bob' },
  { x: 666, y: 300, text: 'One day, deep in the dark, they found {a}.', react: 'A {w}, down here! Nobody up top believed them.', anim: 'twinkle' },
  { x: 150, y: 520, text: 'Then, out of nowhere, came {a}!', react: 'A {w}! I still get shivers when I tell that part.', anim: 'float' },
  { x: 446, y: 486, text: 'In the end they all shared {a}, and the cave was never dark again.', react: 'A {w}. That is how every good story ends. Thank you for remembering it with me.', anim: 'breathe' },
];
const W = 190, H = 140;

function wall(r) {
  let s = '';
  for (const p of PANELS) s += path(sketchRect(p.x - 12, p.y - 12, W + 24, H + 24, r, 7), fill.light);
  // Old paintings nobody can read any more: hands and a running deer, very faint.
  for (const [x, y, k] of [[70, 470, 0.9], [860, 520, -1], [330, 150 + 60, 0.7], [800, 250, 1]]) {
    s += `<g transform="translate(${x} ${y}) scale(${k} ${Math.abs(k)})">` +
      path('M0 0 q-4 -16 2 -26 M6 -2 q0 -20 6 -30 M12 0 q4 -18 10 -24 M16 6 q8 -10 16 -12 M-2 6 q-10 -4 -14 -14 M-2 8 q8 18 20 8', faint) + '</g>';
  }
  s += path('M700 600 l20 -10 l30 0 l16 -12 l4 6 l-8 10 l-4 22 l-6 14 M716 590 l-6 26 M736 590 l2 26 M754 590 l8 24', faint);
  return s;
}

function fireside() {
  const [x, y] = FIRE;
  let s = ellipse(x, y + 2, 46, 8, fill.light);
  for (const [dx, dy, a] of [[-24, -2, -14], [24, -2, 14], [0, 0, 0]]) s += `<g transform="translate(${x + dx} ${y + dy}) rotate(${a})">${path('M-20 0 H20 V-9 H-20 Z', fill.hatch)}</g>`;
  for (let i = 0; i < 8; i++) s += circle(x + Math.cos((i / 8) * Math.PI * 2) * 40, y + 2 + Math.sin((i / 8) * Math.PI * 2) * 6, 6, fill.white);
  // Old Ochre, the cave painter, with a brush behind one ear.
  const ox = 770;
  s += path(`M${ox - 22} ${y} Q${ox - 26} ${y - 50} ${ox} ${y - 58} Q${ox + 26} ${y - 50} ${ox + 22} ${y} Z`, fill.hatch);
  s += circle(ox, y - 74, 16, fill.white) + path(`M${ox - 16} ${y - 80} Q${ox} ${y - 100} ${ox + 16} ${y - 80}`, fill.ink);
  s += path(`M${ox - 6} ${y - 76} h1 M${ox + 5} ${y - 76} h1 M${ox - 5} ${y - 67} q5 3 10 0 M${ox + 14} ${y - 88} l18 -18`, thin);
  s += path(`M${ox + 30} ${y - 108} l4 -4 l3 3 l-4 4 Z`, fill.ink);
  s += path(`M${ox - 20} ${y - 30} l-26 -10 M${ox - 48} ${y - 44} l4 8 l8 -4`, thin);
  return s;
}

const art = () => {
  const r = random(4242);
  return sectionSVG(cave(CAVE, EDGE, r) + path('M70 860 H900', { 'stroke-width': 1.8 }) + wall(r) + fireside() +
    label(480, 168, 'THE STORY WALL', { size: 9, anchor: 'middle', spacing: 4, fill: '#8f8a7e' }));
};

const colourWash = () => washSVG(
  wash(CAVE, COLORS.sand.hex, 0.22) +
  PANELS.map((p) => wash(`M${p.x - 12} ${p.y - 12} h${W + 24} v${H + 24} h${-W - 24} Z`, COLORS.rust.hex, 0.18)).join('') +
  wash('M540 800 h120 v70 h-120 Z', COLORS.marigold.hex, 0.4),
);

function alive(ctx, t, { warmth }) {
  // The fire is always lit, and burns brighter as the story comes back.
  const [x, y] = FIRE, k = 0.7 + warmth * 0.6;
  const g = ctx.createRadialGradient(x, y - 20, 4, x, y - 20, 90 + warmth * 80);
  g.addColorStop(0, `rgba(240,180,41,${0.25 + warmth * 0.25})`);
  g.addColorStop(1, 'rgba(240,180,41,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 20, 90 + warmth * 80, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const h = (26 + i * 8 + Math.sin(t / 90 + i * 2) * 6) * k, w = 12 - i * 3;
    ctx.fillStyle = ['#e2725b', '#f0b429', '#fff1c9'][i];
    ctx.beginPath();
    ctx.moveTo(x - w, y - 8);
    ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.6, x + Math.sin(t / 120 + i) * 4, y - 8 - h);
    ctx.quadraticCurveTo(x + w * 1.1, y - h * 0.6, x + w, y - 8);
    ctx.fill();
  }
  // Sparks drifting up.
  ctx.fillStyle = '#f0b429';
  for (let i = 0; i < 5; i++) {
    const p = (t / 1800 + i / 5) % 1;
    ctx.globalAlpha = 1 - p;
    ctx.fillRect(x + Math.sin(p * 9 + i) * 16, y - 30 - p * 160, 2, 2);
  }
  ctx.globalAlpha = 1;
}

export default {
  id: 'storycave',
  name: 'The Painted Cave',
  col: 1,
  row: 1,
  art,
  wash: colourWash,
  alive,
  photos: [],
  finds: [],
  secrets: [],
  ideas: PANELS.map((p, i) => ({ id: `p${i + 1}`, type: 'space', story: i, x: p.x, y: p.y, w: W, h: H, text: p.text, react: p.react, teller: 'ochre', anim: p.anim, need: 200 })),
  residents: [
    {
      id: 'ochre', name: 'Old Ochre', x: 770, y: 858, w: 60, h: 110,
      lines: ({ has, word }) => {
        const told = PANELS.filter((_, i) => has(`p${i + 1}`)).length;
        if (told === PANELS.length) return [
          `Long ago, a ${word('p1') || 'something'} lived in this cave… You know the rest. You drew it.`,
          'People come down here just to read the wall now. Your wall.',
        ];
        if (told) return ['Go on, the next slab is waiting. I can almost remember the rest…', 'Draw it first, then tell me what it is. That is how cave stories work.'];
        return [
          'Sit by the fire. This cave had a story once, and the walls forgot it. Will you draw it back?',
          'Start with the first slab, top left. Draw whatever lived here, then tell me what it was.',
        ];
      },
    },
  ],
};
