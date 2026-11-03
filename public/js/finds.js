// Little collectable objects drawn on the canvas: paint jars, tools and magic.
import { COLORS, PAINTS, INK, PAPER } from './config.js';

function outline(ctx) {
  ctx.lineWidth = 1.7;
  ctx.strokeStyle = INK;
  ctx.lineJoin = ctx.lineCap = 'round';
}

function jar(ctx, color) {
  ctx.fillStyle = PAINTS[color]?.hex || INK;
  ctx.beginPath();
  ctx.roundRect(-12, -14, 24, 26, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.roundRect(-14, -21, 28, 8, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fffdf8cc';
  ctx.fillRect(-7, -6, 14, 9);
  ctx.strokeRect(-7, -6, 14, 9);
  ctx.beginPath();
  ctx.moveTo(-8, -11);
  ctx.lineTo(-8, 8);
  ctx.strokeStyle = '#ffffff99';
  ctx.stroke();
}

// A china mixing dish with three wells of paint.
function dish(ctx) {
  ctx.fillStyle = '#fffdf8';
  ctx.beginPath();
  ctx.ellipse(0, 2, 22, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(16, -6, 4, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  [[-9, 0, PAINTS.red.hex], [3, 6, PAINTS.yellow.hex], [5, -4, PAINTS.blue.hex]].forEach(([x, y, c]) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function mirror(ctx, t) {
  ctx.rotate(0.5);
  ctx.fillStyle = '#d9d4c7';
  ctx.fillRect(-3, 8, 6, 20);
  ctx.strokeRect(-3, 8, 6, 20);
  ctx.fillStyle = '#e8f1f4';
  ctx.beginPath();
  ctx.ellipse(0, -6, 12, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const shine = (Math.sin(t / 500) + 1) / 2;
  ctx.strokeStyle = `rgba(255,255,255,${0.4 + shine * 0.6})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-5, -13);
  ctx.lineTo(3, -3);
  ctx.stroke();
}

function kaleido(ctx, t) {
  ctx.rotate(-0.4);
  ctx.fillStyle = '#d9d4c7';
  ctx.fillRect(-20, -7, 34, 14);
  ctx.strokeRect(-20, -7, 34, 14);
  const hues = ['coral', 'marigold', 'teal', 'lavender', 'pond', 'blush'];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = COLORS[hues[(i + Math.floor(t / 300)) % 6]].hex;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.arc(16, 0, 10, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(16, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
}

function worm(ctx, t) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) ctx.lineTo(-18 + i * 3, Math.sin(t / 160 + i * 0.7) * 4);
  ctx.stroke();
  ctx.strokeStyle = COLORS.blush.hex;
  ctx.lineWidth = 6.5;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(17, Math.sin(t / 160 + 8.4) * 4 - 1, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

function packet(ctx) {
  ctx.rotate(0.12);
  ctx.fillStyle = PAPER;
  ctx.fillRect(-14, -19, 28, 36);
  ctx.strokeRect(-14, -19, 28, 36);
  ctx.beginPath();
  ctx.moveTo(-14, -13);
  ctx.lineTo(14, -13);
  ctx.stroke();
  ctx.strokeStyle = COLORS.moss.hex;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(0, -2);
  ctx.stroke();
  ctx.fillStyle = COLORS.blush.hex;
  for (let p = 0; p < 5; p++) {
    ctx.beginPath();
    ctx.arc(Math.cos(p * 1.26) * 4, -4 + Math.sin(p * 1.26) * 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.marigold.hex;
  ctx.beginPath();
  ctx.arc(0, -4, 2, 0, Math.PI * 2);
  ctx.fill();
}

function ribbon(ctx, t) {
  const hues = ['#e2725b', '#f0b429', '#6a994e', '#5fa8d3', '#a98bd6'];
  ctx.lineWidth = 4;
  hues.forEach((h, i) => {
    ctx.strokeStyle = h;
    ctx.beginPath();
    for (let k = 0; k <= 16; k++) ctx.lineTo(-18 + k * 2.4, -10 + i * 4 + Math.sin(t / 300 + k * 0.5) * 3);
    ctx.stroke();
  });
  outline(ctx);
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.roundRect(14, -14, 10, 28, 3);
  ctx.fill();
  ctx.stroke();
}

function fireflyJar(ctx, t) {
  const glow = 0.5 + Math.sin(t / 300) * 0.3;
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
  g.addColorStop(0, `rgba(240,180,41,${glow})`);
  g.addColorStop(1, 'rgba(240,180,41,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,253,248,0.5)';
  ctx.beginPath();
  ctx.roundRect(-11, -14, 22, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d9d4c7';
  ctx.fillRect(-9, -19, 18, 6);
  ctx.strokeRect(-9, -19, 18, 6);
  ctx.fillStyle = COLORS.marigold.hex;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(Math.sin(t / 400 + i * 2) * 6, Math.cos(t / 350 + i) * 7, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawFind(ctx, find, t) {
  const [kind, key] = find.id.split(':');
  const phase = (find.wx * 0.013 + find.wy * 0.007) % 6.28;
  ctx.save();
  ctx.translate(find.wx, find.wy + Math.sin(t / 650 + phase) * 2.5);
  outline(ctx);
  if (key === 'rainbow') ribbon(ctx, t);
  else if (kind === 'color') jar(ctx, key);
  else if (key === 'dish') dish(ctx);
  else if (key === 'mirror') mirror(ctx, t);
  else if (key === 'kaleido') kaleido(ctx, t);
  else if (key === 'wiggle') worm(ctx, t);
  else if (key === 'sprout') packet(ctx);
  else if (key === 'glow') fireflyJar(ctx, t);
  ctx.restore();
}
