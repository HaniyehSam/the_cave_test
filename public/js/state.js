// The one mutable state object shared by every module.
import { STARTING_FINDS } from './config.js';

// Where every visit starts: Paper Street, framed to fit the screen.
const compactView = innerWidth < 680;
export const homeCamera = () => (compactView ? { x: 330, y: 500, zoom: 0.62 } : { x: 480, y: 470, zoom: 1.1 });

export const state = {
  camera: homeCamera(),
  view: { width: innerWidth, height: innerHeight, dpr: 1 },

  strokes: [],            // committed lines and fills, in drawing order
  redo: [],
  active: null,           // the line being drawn right now

  found: new Set(STARTING_FINDS),
  fresh: new Set(),       // finds not yet tried, shown with a dot
  secrets: new Set(),     // secrets revealed by painting
  talked: {},             // resident id -> how many lines heard
  visited: new Set(),     // hand-made zones you have been to, for the map

  tool: 'pencil',
  color: 'ink',
  pattern: 'solid',
  size: 7,
  mods: { mirror: false, kaleido: false, wiggle: false, sprout: false, rainbow: false, glow: false },
  moving: false,          // hand tool, or space held

  warmth: {},             // zone id -> 0..1 target, from paint
  shownWarmth: {},        // zone id -> eased value actually drawn
  dirty: true,
};

export const markDirty = () => { state.dirty = true; };
