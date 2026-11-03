// Half-finished drawings waiting to be traced, and the ways a finished drawing comes alive.
// Shapes are lists of polylines in a box about 100 units wide, centred on 0,0.
// No DOM in here: the tests load it too.

const ring = (cx, cy, rx, ry = rx, a0 = 0, a1 = Math.PI * 2) => {
  const n = Math.max(8, Math.round((Math.abs(a1 - a0) * Math.max(rx, ry)) / 6));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
};
const wave = (x0, y0, x1, y1, amp, waves) => Array.from({ length: 25 }, (_, i) => {
  const k = i / 24, nx = -(y1 - y0), ny = x1 - x0, len = Math.hypot(nx, ny) || 1;
  const o = Math.sin(k * Math.PI * 2 * waves) * amp;
  return [x0 + (x1 - x0) * k + (nx / len) * o, y0 + (y1 - y0) * k + (ny / len) * o];
});
const star = (cx, cy, r, inner = 0.45, points = 5) => Array.from({ length: points * 2 + 1 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / points, rr = i % 2 ? r * inner : r;
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
});

// anim: how it moves once traced. pivot: what it turns around (base, top or centre).
export const SHAPES = {
  car: { anim: 'drive',
    lines: () => [
      [[-50, 10], [-50, -8], [-32, -11], [-19, -30], [21, -30], [35, -11], [50, -7], [50, 10], [-50, 10]],
      [[-13, -12], [-6, -25], [17, -25], [25, -12], [-13, -12]],
      ring(-28, 12, 10), ring(28, 12, 10),
    ],
  },
  van: { anim: 'drive',
    lines: () => [
      [[-55, 12], [-55, -40], [22, -40], [38, -20], [55, -14], [55, 12], [-55, 12]],
      [[26, -36], [36, -20], [24, -20], [24, -36]],
      ring(-32, 14, 11), ring(32, 14, 11),
    ],
  },
  bicycle: { anim: 'drive',
    lines: () => [ring(-30, 14, 20), ring(30, 14, 20), [[-30, 14], [-6, -16], [24, -16], [30, 14]], [[-6, -16], [2, 14], [24, -16]], [[-10, -24], [0, -24]], [[24, -16], [20, -30], [30, -30]]],
  },
  train: { anim: 'drive',
    lines: () => [
      [[-55, 14], [-55, -34], [55, -34], [55, 14], [-55, 14]],
      [[-60, -34], [60, -34]],
      [[-44, -24], [-20, -24], [-20, -4], [-44, -4], [-44, -24]], [[-8, -24], [16, -24], [16, -4], [-8, -4], [-8, -24]], [[28, -24], [46, -24], [46, -4], [28, -4], [28, -24]],
      ring(-34, 16, 9), ring(34, 16, 9),
    ],
  },
  boat: { anim: 'bob',
    lines: () => [[[-55, 0], [55, 0], [40, 22], [-40, 22], [-55, 0]], [[0, 0], [0, -72]], [[5, -68], [42, -8], [5, -8], [5, -68]], [[-5, -60], [-34, -10], [-5, -10]]],
  },
  fish: { anim: 'swim',
    lines: () => [ring(-6, 0, 38, 20, 0.35, Math.PI * 2 - 0.35), [[29, -7], [56, -22], [52, 0], [56, 22], [29, 7]], ring(-26, -5, 3.5), [[-4, -12], [2, 0], [-4, 12]]],
  },
  bird: { anim: 'flap', pivot: 'center',
    lines: () => [[[-44, 2], [-30, -12], [-14, -12], [0, 4]], [[0, 4], [14, -12], [30, -12], [44, 2]], ring(0, 8, 5)],
  },
  bat: { anim: 'flap',
    lines: () => [[[-50, -6], [-34, -18], [-30, -4], [-20, -10], [-16, 4], [-8, -2], [0, 6], [8, -2], [16, 4], [20, -10], [30, -4], [34, -18], [50, -6]], ring(0, -2, 7, 9), [[-4, -10], [-6, -16]], [[4, -10], [6, -16]]],
  },
  butterfly: { anim: 'flutter',
    lines: () => [ring(-19, -12, 18, 15), ring(19, -12, 18, 15), ring(-14, 13, 12, 10), ring(14, 13, 12, 10), [[0, -22], [0, 24]], [[0, -22], [-8, -36]], [[0, -22], [8, -36]]],
  },
  kite: { anim: 'float',
    lines: () => [[[0, -50], [32, -4], [0, 46], [-32, -4], [0, -50]], [[0, -50], [0, 46]], [[-32, -4], [32, -4]], [[0, 46], [-12, 64], [8, 82], [-8, 100], [6, 116]]],
  },
  balloon: { anim: 'float',
    lines: () => [ring(0, -30, 38, 44, Math.PI * 0.82, Math.PI * 2.18), [[-26, 2], [-11, 38]], [[26, 2], [11, 38]], [[-13, 38], [13, 38], [11, 58], [-11, 58], [-13, 38]], ring(0, -30, 14, 44, -Math.PI / 2, Math.PI / 2)],
  },
  plane: { anim: 'fly',
    lines: () => [[[-50, 0], [52, -14], [-22, 20], [-50, 0]], [[-22, 20], [-14, 4], [52, -14]], [[-50, 0], [-14, 4]]],
  },
  rocket: { anim: 'float',
    lines: () => [[[0, -62], [17, -30], [17, 32], [-17, 32], [-17, -30], [0, -62]], [[-17, 8], [-32, 38], [-17, 32]], [[17, 8], [32, 38], [17, 32]], ring(0, -14, 8), [[-8, 32], [0, 52], [8, 32]]],
  },
  sun: { anim: 'spin',
    lines: () => [ring(0, 0, 24), ...Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return [[Math.cos(a) * 32, Math.sin(a) * 32], [Math.cos(a) * 48, Math.sin(a) * 48]];
    })],
  },
  star: { anim: 'twinkle', lines: () => [star(0, 0, 44)] },
  moon: { anim: 'breathe',
    lines: () => [ring(0, 0, 40, 40, Math.PI * 0.3, Math.PI * 1.7), ring(49.6, 0, 41.6, 41.6, 4.034, 2.25)],
  },
  cloud: { anim: 'drift',
    lines: () => [[...ring(-30, 6, 20, 18, Math.PI * 0.5, Math.PI * 1.5), ...ring(-6, -10, 24, 24, Math.PI, Math.PI * 1.9), ...ring(26, -2, 22, 20, Math.PI * 1.3, Math.PI * 2.5), [-30, 24]]],
  },
  flower: { anim: 'sway', pivot: 'base',
    lines: () => [[[0, 60], [0, -4]], ...Array.from({ length: 6 }, (_, i) => ring(Math.cos((i * Math.PI) / 3) * 15, -20 + Math.sin((i * Math.PI) / 3) * 15, 9)), ring(0, -20, 7), [[0, 34], [16, 22], [24, 26], [0, 40]]],
  },
  tree: { anim: 'sway', pivot: 'base',
    lines: () => [[[-7, 62], [-5, 12]], [[7, 62], [5, 12]], [[-5, 22], [-18, 8]], ring(0, -22, 44, 38, Math.PI * 0.62, Math.PI * 2.38)],
  },
  house: { anim: 'breathe', pivot: 'base',
    lines: () => [[[-42, 44], [-42, -8], [0, -46], [42, -8], [42, 44], [-42, 44]], [[-9, 44], [-9, 14], [9, 14], [9, 44]], [[-32, 0], [-16, 0], [-16, 14], [-32, 14], [-32, 0]], [[16, 0], [32, 0], [32, 14], [16, 14], [16, 0]], [[20, -24], [20, -44], [30, -44], [30, -15]]],
  },
  cat: { anim: 'bob', pivot: 'base',
    lines: () => [ring(0, 16, 22, 28, -Math.PI * 0.32, Math.PI * 1.32), ring(0, -24, 16, 14), [[-12, -33], [-10, -46], [-3, -37]], [[3, -37], [10, -46], [12, -33]], [[21, 34], [42, 26], [40, 6]], ring(-6, -25, 2), ring(6, -25, 2)],
  },
  snail: { anim: 'crawl',
    lines: () => {
      const spiral = Array.from({ length: 40 }, (_, i) => { const a = i * 0.32, r = 2 + i * 0.62; return [6 + Math.cos(a) * r, -6 + Math.sin(a) * r]; });
      return [spiral, [[-44, 20], [40, 20], [44, 12], [32, 14]], [[-36, 20], [-44, 0], [-46, -14]], [[-40, 4], [-36, -16]]];
    },
  },
  worm: { anim: 'crawl', lines: () => [wave(-46, 0, 46, 0, 8, 2), ring(46, 0, 5)] },
  lantern: { anim: 'sway', pivot: 'top',
    lines: () => [[[0, -60], [0, -40]], [[-14, -40], [14, -40]], ring(0, -10, 22, 30), [[-14, 20], [14, 20]], [[0, 20], [0, 36]], [[-4, 36], [4, 36]]],
  },
  jellyfish: { anim: 'float',
    lines: () => [[...ring(0, 0, 34, 30, Math.PI, Math.PI * 2), [-34, 0]], wave(-22, 0, -22, 60, 4, 2), wave(-7, 0, -7, 66, 4, 2.5), wave(8, 0, 8, 62, 4, 2), wave(22, 0, 22, 56, 4, 1.5)],
  },
  mushroom: { anim: 'bob', pivot: 'base',
    lines: () => [[...ring(0, -6, 40, 34, Math.PI, Math.PI * 2), [-40, -6]], [[-12, -6], [-14, 40], [14, 40], [12, -6]], ring(-16, -22, 5), ring(12, -28, 6)],
  },
  crystal: { anim: 'twinkle', pivot: 'base',
    lines: () => [[[-30, 40], [-34, -10], [-22, -30], [-12, -10], [-14, 40]], [[-14, 40], [-10, -30], [4, -56], [16, -30], [14, 40]], [[14, 40], [18, -4], [30, -18], [38, 0], [34, 40]], [[-36, 40], [40, 40]]],
  },
  fossil: { anim: 'spin',
    lines: () => [Array.from({ length: 60 }, (_, i) => { const a = i * 0.26, r = 1 + i * 0.68; return [Math.cos(a) * r, Math.sin(a) * r]; }), ...Array.from({ length: 6 }, (_, i) => { const a = 1 + i * 0.9, r = 12 + i * 5; return [[Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7], [Math.cos(a) * r, Math.sin(a) * r]]; })],
  },
  teacup: { anim: 'breathe', pivot: 'base',
    lines: () => [[[-30, -10], [-26, 22], [26, 22], [30, -10], [-30, -10]], ring(38, 4, 10, 10, -Math.PI / 2, Math.PI / 2), [[-40, 30], [40, 30]], wave(-8, -18, -8, -48, 4, 1), wave(8, -18, 8, -44, 4, 1)],
  },
  umbrella: { anim: 'sway', pivot: 'base',
    lines: () => [[...ring(0, 0, 46, 36, Math.PI, Math.PI * 2), ...ring(31, 0, 15, 8, 0, Math.PI), ...ring(0, 0, 16, 8, 0, Math.PI), ...ring(-31, 0, 15, 8, 0, Math.PI)], [[0, -36], [0, 50], [-10, 54], [-14, 46]]],
  },
};

// Every way a drawing can move. Each returns [dx, dy, turn, sx, sy] at time t (ms),
// and `reach` is how far from home it can travel, for culling.
const S = Math.sin, C = Math.cos;
export const ANIMS = {
  drive:   { reach: 150, at: (t, p) => [S(t / 2600 + p) * 130, -Math.abs(S(t / 110)) * 1.5, 0, C(t / 2600 + p) >= 0 ? 1 : -1, 1] },
  crawl:   { reach: 50,  at: (t, p) => [S(t / 5200 + p) * 40, 0, 0, C(t / 5200 + p) >= 0 ? 1 : -1, 1] },
  swim:    { reach: 110, at: (t, p) => [S(t / 3000 + p) * 90, S(t / 700 + p) * 6, S(t / 700 + p) * 0.06, C(t / 3000 + p) >= 0 ? -1 : 1, 1] },
  bob:     { reach: 10,  at: (t, p) => [0, S(t / 600 + p) * 5, S(t / 900 + p) * 0.03, 1, 1] },
  float:   { reach: 30,  at: (t, p) => [S(t / 1700 + p) * 10, S(t / 1100 + p) * 16, S(t / 1300 + p) * 0.05, 1, 1] },
  fly:     { reach: 140, at: (t, p) => [S(t / 2600 + p) * 120, S(t / 800 + p) * 14, S(t / 800 + p) * 0.08, C(t / 2600 + p) >= 0 ? 1 : -1, 1] },
  flap:    { reach: 130, at: (t, p) => [S(t / 2800 + p) * 110, S(t / 900 + p) * 18, 0, 1, 0.45 + 0.55 * Math.abs(C(t / 190 + p))] },
  flutter: { reach: 50,  at: (t, p) => [S(t / 1900 + p) * 30, S(t / 700 + p) * 14, 0, 0.3 + 0.7 * Math.abs(C(t / 150 + p)), 1] },
  sway:    { reach: 14,  at: (t, p) => [0, 0, S(t / 1100 + p) * 0.07, 1, 1] },
  spin:    { reach: 10,  at: (t, p) => [0, 0, t / 2200 + p, 1, 1] },
  twinkle: { reach: 12,  at: (t, p) => [0, 0, 0, 1 + S(t / 300 + p) * 0.08, 1 + S(t / 300 + p) * 0.08] },
  breathe: { reach: 6,   at: (t, p) => [0, 0, 0, 1 + S(t / 900 + p) * 0.025, 1 + S(t / 900 + p) * 0.025] },
  drift:   { reach: 70,  at: (t, p) => [S(t / 5000 + p) * 60, S(t / 2300 + p) * 4, 0, 1, 1] },
};

// A shape's polylines placed in a zone: scaled by s, flipped if asked, centred on x, y.
export function placeShape(name, x, y, s = 1, flip = false) {
  return SHAPES[name].lines().map((line) => line.map(([px, py]) => [x + (flip ? -px : px) * s, y + py * s]));
}

// Points every `step` units along polylines, for checking how much has been traced.
export function samplesAlong(lines, step = 7) {
  const out = [];
  for (const line of lines) {
    out.push(line[0]);
    let carry = 0;
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1], [bx, by] = line[i], len = Math.hypot(bx - ax, by - ay);
      let d = step - carry;
      while (d <= len) {
        out.push([ax + ((bx - ax) * d) / len, ay + ((by - ay) * d) / len]);
        d += step;
      }
      carry = len - (d - step);
    }
  }
  return out;
}

export const withArticle = (words) => `${/^[aeiou]/i.test(words) ? 'an' : 'a'} ${words}`;
