// The one mutable state object shared by every module.
import { STARTING_FINDS, WORLD, SECTION } from './config.js';

// The zoom is fixed: nobody can zoom in or out, it only changes with the screen size.
export const fixedZoom = () => (innerWidth < 680 ? 0.62 : 0.95) * 1.25 ** 2;
// Paper Street, framed to fit the screen: the middle of town, where the home button goes.
export const homeCamera = () => (innerWidth < 680 ? { x: 330, y: 500 } : { x: 480, y: 470 });
// Every story starts off the midnight train, at the station on the far side of town.
export const startCamera = () => clampCamera(innerWidth < 680 ? { x: 6 * 960 + 560, y: 520 } : { x: 6 * 960 + 520, y: 480 });

export const state = {
  camera: startCamera(),
  view: { width: innerWidth, height: innerHeight, dpr: 1 },

  strokes: [],            // committed lines and fills, in drawing order
  redo: [],
  active: null,           // the line being drawn right now

  found: new Set(STARTING_FINDS),
  secrets: new Set(),     // secrets revealed by painting
  ideas: new Set(),       // drawing ideas finished, as "zone:idea"
  words: {},              // story cave panel -> what the visitor said they drew
  mixes: [],              // colours made in the mixing dish, as '#rrggbb'
  paraded: false,         // the town has had its parade (see story.js)
  talked: {},             // resident id -> how many lines heard
  visited: new Set(),     // hand-made zones you have been to, for the map

  tool: 'pencil',
  color: 'ink',
  size: 7,
  mods: { mirror: false, kaleido: false, wiggle: false, sprout: false, glow: false },
  moving: false,          // hand tool, or space held

  warmth: {},             // zone id -> 0..1 target, from paint
  shownWarmth: {},        // zone id -> eased value actually drawn
  dirty: true,
};

export const markDirty = () => { state.dirty = true; };

export function clampCamera(cam) {
  const x0 = WORLD.c0 * SECTION, x1 = (WORLD.c1 + 1) * SECTION, y0 = WORLD.r0 * SECTION, y1 = (WORLD.r1 + 1) * SECTION;
  return { x: Math.min(x1, Math.max(x0, cam.x)), y: Math.min(y1, Math.max(y0, cam.y)), zoom: fixedZoom() };
}
