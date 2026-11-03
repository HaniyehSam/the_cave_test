// The spaces between the hand-made zones: nothing in them, but the world carries on
// through them. The street keeps its pavement and road, the tunnels keep going
// underground, and the sky is just sky. Past the edge of Little Margin there is only paper.
//
// Where Mr Quill never got round to drawing a building, he pasted up a photograph of one.
import { WORLD, GROUND } from '../config.js';
import { sectionSVG, path, rect, random, groundStrip, TONE, TUNNEL } from '../svg.js';

const seedOf = (col, row) => (Math.imul(col, 73856093) ^ Math.imul(row, 19349663) ^ 0x5bd1e995) >>> 0;
export const inWorld = (col, row) => col >= WORLD.c0 && col <= WORLD.c1 && row >= WORLD.r0 && row <= WORLD.r1;

// Photographs standing in for buildings, by street column: [photo, centre x, height].
const PASTED = {
  '-4': ['bld-colmar', 470, 430],
  '-3': ['bld-clothes-shop', 500, 400],
  '-1': ['bld-rue-du-regard', 450, 420],
  2: ['bld-clamart', 500, 430],
  4: ['bld-ferronnerie', 420, 520],
  5: ['bld-spelman', 520, 330],
  7: ['bld-stone-cottage', 400, 260],
};

function tunnel() {
  // Rock above and below, with the tunnel the caves open into running straight through.
  return rect(0, 0, 960, 960, { fill: TONE.light, stroke: 'none' }) +
    rect(0, TUNNEL.top, 960, TUNNEL.bottom - TUNNEL.top, { fill: TONE.white, stroke: 'none' }) +
    path(`M0 ${TUNNEL.top} H960 M0 ${TUNNEL.bottom} H960`, { 'stroke-width': 2.6 });
}

export function emptyZone(col, row) {
  const inside = inWorld(col, row);
  let art = '';
  if (inside && row === 0) art = groundStrip(random(seedOf(col, row)));
  else if (inside && row > 0) art = tunnel();
  const pasted = inside && row === 0 && PASTED[col];
  const photos = pasted ? [{ src: pasted[0], x: pasted[1], y: GROUND - pasted[2] / 2 + 8, h: pasted[2], rotate: col % 2 ? -1 : 1, tape: 2 }] : [];
  return {
    id: `empty:${col},${row}`,
    name: '',
    col,
    row,
    empty: true,
    art: () => sectionSVG(art),
    photos,
    finds: [],
    secrets: [],
    ideas: [],
    residents: [],
  };
}
