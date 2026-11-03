// Things that move whatever you do: clouds drifting behind everything, birds and paper
// planes crossing the sky, and traffic on the road. Each lane repeats forever along x, so the
// world never runs out of them, and every vehicle and cloud is drawn a little differently.
import { GROUND, SECTION, INK, WORLD } from './config.js';
import { random } from './svg.js';
import { drawLine } from './paint.js';
import { photoImage } from './world.js';

const SKY_TOP = -3 * SECTION;
const CLOUDS_END = 420;   // below this, buildings start
const WHITE = '#fffdf8';

function lanes(seed, from, to, gap, make) {
  const r = random(seed), out = [];
  for (let y = from + r() * gap; y < to; y += gap * (0.7 + r() * 0.6)) out.push({ y, seed: Math.floor(r() * 1e9), ...make(r) });
  return out;
}
const CLOUD_LANES = lanes(77, SKY_TOP, CLOUDS_END, 170, (r) => ({ speed: (5 + r() * 12) * (r() < 0.5 ? -1 : 1), period: 700 + r() * 700 }));
const FLYER_LANES = lanes(78, SKY_TOP, 360, 420, (r) => ({ speed: (40 + r() * 35) * (r() < 0.5 ? -1 : 1), period: 1900 + r() * 1400 }));
const ROAD_LANES = [
  { y: GROUND + 78, speed: -82, period: 1500, seed: 11 },
  { y: GROUND + 142, speed: 96, period: 1750, seed: 12 },
];

// Every instance of a lane that overlaps [x0, x1], with its own random source.
function* along(lane, t, x0, x1, margin) {
  const offset = ((((t / 1000) * lane.speed) % lane.period) + lane.period) % lane.period;
  for (let n = Math.floor((x0 - offset - margin) / lane.period); n <= Math.floor((x1 - offset + margin) / lane.period); n++) {
    const r = random((lane.seed ^ Math.imul(n, 2654435761)) >>> 0);
    const x = n * lane.period + offset + r() * lane.period * 0.35;
    if (x > x0 - margin && x < x1 + margin) yield { x, r, n };
  }
}

const inBand = (view, top, bottom) => view.y < bottom && view.y + view.h > top;

// ---------- Sky ----------

function cloud(ctx, x, y, w, r) {
  const bumps = 3 + Math.floor(r() * 3), step = w / bumps;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < bumps; i++) {
    const rad = step * (0.55 + (i > 0 && i < bumps - 1 ? 0.25 + r() * 0.2 : r() * 0.1));
    const cx = x + step * (i + 0.5);
    ctx.ellipse(cx, y, step / 2, rad, 0, Math.PI, 0);
  }
  ctx.quadraticCurveTo(x + w / 2, y + 12, x, y);
  ctx.fill();
  ctx.stroke();
}

// Clouds go behind the artwork, so buildings and islands hide them.
export function drawSky(ctx, view, t) {
  if (!inBand(view, SKY_TOP - 100, CLOUDS_END)) return;
  ctx.save();
  ctx.fillStyle = WHITE;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  for (const lane of CLOUD_LANES) {
    if (lane.y < view.y - 120 || lane.y > view.y + view.h + 60) continue;
    for (const { x, r } of along(lane, t, view.x, view.x + view.w, 260)) {
      if (r() < 0.3) continue;
      cloud(ctx, x, lane.y + (r() - 0.5) * 60, 80 + r() * 150, r);
    }
  }
  ctx.restore();
}

function bird(ctx, x, y, t, k) {
  const w = Math.sin(t / 120 + k) * 5;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - w);
  ctx.quadraticCurveTo(x - 4, y - 7, x, y);
  ctx.quadraticCurveTo(x + 4, y - 7, x + 10, y - w);
  ctx.stroke();
}

function plane(ctx, x, y, dir, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t / 500) * 6);
  ctx.scale(dir, 1);
  ctx.rotate(Math.sin(t / 700) * 0.08);
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(26, -7);
  ctx.lineTo(-11, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-11, 10);
  ctx.lineTo(-7, 2);
  ctx.lineTo(26, -7);
  ctx.stroke();
  ctx.restore();
}

// Birds and the odd paper plane, in front of everything.
export function drawFlyers(ctx, view, t) {
  if (!inBand(view, SKY_TOP, 380)) return;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 1.5;
  ctx.lineCap = ctx.lineJoin = 'round';
  for (const lane of FLYER_LANES) {
    if (lane.y < view.y - 80 || lane.y > view.y + view.h + 80) continue;
    for (const { x, r } of along(lane, t, view.x, view.x + view.w, 120)) {
      if (r() < 0.4) continue;
      const y = lane.y + Math.sin(t / 900 + x * 0.01) * 12;
      if (r() < 0.18) {
        plane(ctx, x, y, Math.sign(lane.speed), t);
        continue;
      }
      const n = 2 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) bird(ctx, x - Math.sign(lane.speed) * i * 22 + r() * 6, y + (i % 2 ? 10 : -4) * Math.min(i, 2), t, i * 1.7);
    }
  }
  ctx.restore();
}

// ---------- Road ----------

function wheel(ctx, x, y, rad, spin) {
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = spin + (i * Math.PI) / 3;
    ctx.moveTo(x - Math.cos(a) * rad * 0.7, y - Math.sin(a) * rad * 0.7);
    ctx.lineTo(x + Math.cos(a) * rad * 0.7, y + Math.sin(a) * rad * 0.7);
  }
  ctx.stroke();
}

const VEHICLES = {
  car(ctx, r, spin) {
    const len = 90 + r() * 30, h = 26 + r() * 8, roof = 22 + r() * 8, nose = 12 + r() * 10;
    ctx.beginPath();
    ctx.moveTo(-len / 2, -8);
    ctx.lineTo(-len / 2, -h);
    ctx.lineTo(-len / 2 + nose, -h - 2);
    ctx.lineTo(-len / 2 + nose + 12, -h - roof);
    ctx.lineTo(len / 2 - nose - 18, -h - roof);
    ctx.lineTo(len / 2 - nose, -h);
    ctx.lineTo(len / 2, -h + 6);
    ctx.lineTo(len / 2, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-len / 2 + nose + 14, -h - 3);
    ctx.lineTo(-len / 2 + nose + 20, -h - roof + 5);
    ctx.lineTo(len / 2 - nose - 20, -h - roof + 5);
    ctx.lineTo(len / 2 - nose - 6, -h - 3);
    ctx.moveTo(0, -h - roof + 5);
    ctx.lineTo(0, -10);
    ctx.stroke();
    wheel(ctx, -len / 2 + 20, -8, 10, spin);
    wheel(ctx, len / 2 - 20, -8, 10, spin);
  },
  van(ctx, r, spin, t, dir) {
    const len = 120 + r() * 20;
    ctx.beginPath();
    ctx.moveTo(-len / 2, -8);
    ctx.lineTo(-len / 2, -64);
    ctx.lineTo(len / 2 - 30, -64);
    ctx.lineTo(len / 2 - 8, -36);
    ctx.lineTo(len / 2, -32);
    ctx.lineTo(len / 2, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(len / 2 - 30, -58);
    ctx.lineTo(len / 2 - 14, -38);
    ctx.lineTo(len / 2 - 30, -38);
    ctx.closePath();
    ctx.moveTo(len / 2 - 36, -64);
    ctx.lineTo(len / 2 - 36, -10);
    ctx.stroke();
    ctx.save();
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    // Lettering reads the right way round whichever way the van is driving.
    ctx.translate(-18, -34);
    ctx.scale(dir, 1);
    ctx.textAlign = 'center';
    ctx.fillText(['Buttons & Co.', 'Moth Removals', 'Fresh Bread', 'Kites Repaired', 'Ink Delivery'][Math.floor(r() * 5)], 0, 0);
    ctx.restore();
    wheel(ctx, -len / 2 + 22, -8, 11, spin);
    wheel(ctx, len / 2 - 24, -8, 11, spin);
  },
  bus(ctx, r, spin, t, dir) {
    const len = 190;
    ctx.beginPath();
    ctx.roundRect(-len / 2, -78, len, 70, [10, 10, 2, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let x = -len / 2 + 12; x < len / 2 - 30; x += 30) ctx.rect(x, -68, 22, 22);
    ctx.rect(len / 2 - 24, -68, 16, 50);
    ctx.moveTo(-len / 2, -36);
    ctx.lineTo(len / 2 - 30, -36);
    ctx.stroke();
    ctx.save();
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = INK;
    ctx.translate(len / 2 - 16, -72);
    ctx.scale(dir, 1);
    ctx.textAlign = 'center';
    ctx.fillText(`${2 + Math.floor(r() * 90)}`, 0, 0);
    ctx.restore();
    wheel(ctx, -len / 2 + 30, -8, 12, spin);
    wheel(ctx, len / 2 - 34, -8, 12, spin);
  },
  bicycle(ctx, r, spin, t) {
    const pedal = t / 160;
    wheel(ctx, -24, -14, 14, spin);
    wheel(ctx, 24, -14, 14, spin);
    ctx.beginPath();
    ctx.moveTo(-24, -14);
    ctx.lineTo(-4, -34);
    ctx.lineTo(18, -34);
    ctx.lineTo(24, -14);
    ctx.moveTo(-4, -34);
    ctx.lineTo(0, -14);
    ctx.lineTo(18, -34);
    // The rider: body, head, and legs going round.
    ctx.moveTo(-6, -38);
    ctx.lineTo(4, -66);
    ctx.lineTo(18, -44);
    ctx.moveTo(4, -66);
    ctx.lineTo(-6, -38);
    ctx.lineTo(Math.cos(pedal) * 8, -14 + Math.sin(pedal) * 8);
    ctx.moveTo(-6, -38);
    ctx.lineTo(-Math.cos(pedal) * 8, -14 - Math.sin(pedal) * 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(6, -76, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (r() < 0.5) {   // a scarf flapping behind
      ctx.beginPath();
      ctx.moveTo(2, -66);
      ctx.quadraticCurveTo(-14, -70 + Math.sin(t / 90) * 4, -26, -64 + Math.sin(t / 70) * 5);
      ctx.stroke();
    }
  },
};
// Real cars, pasted in from old photographs. `face` is the way each one points: -1 left, 1 right.
const PHOTO_CARS = [
  { src: 'car-two-cents', face: -1, h: 92 },
  { src: 'car-floors-truck', face: -1, h: 80 },
  { src: 'car-delivery-trucks', face: 1, h: 86 },
  { src: 'car-ford-touring', face: -1, h: 70 },
];

// Vehicles are drawn facing right; the lane flips them. A photo is flipped again if it faces left.
function photoCar(ctx, r) {
  const car = PHOTO_CARS[Math.floor(r() * PHOTO_CARS.length)], img = photoImage(car.src);
  if (!img) return;
  const w = (car.h * img.width) / img.height;
  ctx.save();
  if (car.face < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -car.h + 8, w, car.h);
  ctx.restore();
}

const KINDS = ['car', 'car', 'photo', 'van', 'bus', 'bicycle', 'photo', 'car', 'bicycle', 'photo'];

export function drawTraffic(ctx, view, t) {
  if (!inBand(view, GROUND, GROUND + 150)) return;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 1.6;
  ctx.lineCap = ctx.lineJoin = 'round';
  for (const lane of ROAD_LANES) {
    for (const { x, r } of along(lane, t, view.x, view.x + view.w, 160)) {
      if (r() < 0.25) continue;
      const kind = KINDS[Math.floor(r() * KINDS.length)], dir = Math.sign(lane.speed);
      // Wheels turn with the distance travelled, so they never slip.
      const spin = (x / 11) * dir;
      ctx.save();
      ctx.translate(x, lane.y);
      ctx.scale(dir, 1);
      if (kind === 'photo') photoCar(ctx, r);
      else VEHICLES[kind](ctx, r, spin, t, dir);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- The parade ----------
// Every drawing that came alive rides down the road on a little float, end to end through town.

const FLOAT_GAP = 320, PARADE_SPEED = 40;

export function drawParade(ctx, view, t, groups) {
  if (!groups.length || !inBand(view, GROUND, GROUND + 150)) return;
  const x0 = WORLD.c0 * SECTION, span = (WORLD.c1 - WORLD.c0 + 1) * SECTION;
  const lane = GROUND + 132, now = Date.now();
  // Repeat the line of floats so the parade fills the whole road, however few drawings there are.
  const length = Math.max(groups.length * FLOAT_GAP, 2400), copies = Math.ceil(span / length);
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  for (let c = 0; c < copies; c++)
    groups.forEach((g, i) => {
      const x = x0 + ((((t / 1000) * PARADE_SPEED + c * length + i * FLOAT_GAP) % span) + span) % span;
      if (x < view.x - 200 || x > view.x + view.w + 200) return;
      const k = Math.min(1, 96 / g.box.h, 150 / g.box.w), bob = Math.abs(Math.sin(t / 300 + i)) * 3;
      // The float: a plank on two wheels.
      ctx.strokeStyle = INK;
      ctx.fillStyle = WHITE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.rect(x - 70, lane - 16, 140, 10);
      ctx.fill();
      ctx.stroke();
      wheel(ctx, x - 48, lane - 2, 8, x / 8);
      wheel(ctx, x + 48, lane - 2, 8, x / 8);
      ctx.save();
      ctx.translate(x, lane - 16 - bob);
      ctx.scale(k, k);
      ctx.translate(-(g.box.x + g.box.w / 2), -(g.box.y + g.box.h));
      for (const s of g.strokes) drawLine(ctx, s, now);
      ctx.restore();
    });
  ctx.restore();
}
