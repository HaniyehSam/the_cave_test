// Shared constants and the catalogue of everything a visitor can find.

export const SECTION = 960;      // world units per section; zones are one section each
export const PAPER = '#f8f7f2';
export const INK = '#292824';
export const GROUND = 700;       // pavement line of every street section

// Colours the artwork uses for its washes and little details. Not paints you can hold.
export const COLORS = {
  ink:      { hex: '#292824', name: 'Ink' },
  coral:    { hex: '#e2725b', name: 'Coral' },
  blush:    { hex: '#f2a7b5', name: 'Blush' },
  marigold: { hex: '#f0b429', name: 'Marigold' },
  lantern:  { hex: '#d64545', name: 'Lantern red' },
  teal:     { hex: '#2a9d8f', name: 'Teal' },
  moss:     { hex: '#6a994e', name: 'Moss' },
  pond:     { hex: '#5fa8d3', name: 'Pond blue' },
  lavender: { hex: '#a98bd6', name: 'Lavender' },
  rust:     { hex: '#b5523b', name: 'Rust' },
  sea:      { hex: '#1f7a8c', name: 'Deep sea' },
  sand:     { hex: '#e3c58f', name: 'Sand' },
  silver:   { hex: '#a9b0b8', name: 'Moon silver' },
  mint:     { hex: '#8fd3b6', name: 'Mint' },
  plum:     { hex: '#7b4b94', name: 'Plum' },
  midnight: { hex: '#2f3e6e', name: 'Midnight' },
  sepia:    { hex: '#8a6a4f', name: 'Sepia ink' },
  beet:     { hex: '#9b2d4f', name: 'Beetroot' },
};

// The few paints a visitor can find. A handful more can be mixed in the dish (mix.js).
export const PAINTS = {
  ink:     { hex: '#292824', name: 'Ink' },
  red:     { hex: '#d8433b', name: 'Poppy red' },
  yellow:  { hex: '#f2bb1d', name: 'Sun yellow' },
  blue:    { hex: '#2867b2', name: 'Cornflower blue' },
  sepia:   { hex: '#8a6a4f', name: 'Sepia' },
  white:   { hex: '#fffdf8', name: 'Chalk white', mixOnly: true },
  rainbow: { hex: '#e2725b', name: 'Rainbow' },
};

// The paint tin (fill.js) is switched off for now: drawing comes first.
export const TOOLS = {
  pencil: { name: 'Pencil' },
  eraser: { name: 'Eraser' },
  dish:   { name: 'Mixing dish' },
};

export const MODS = {
  mirror:  { name: 'Hand mirror (M)' },
  kaleido: { name: 'Kaleidoscope (K)' },
  wiggle:  { name: 'Wiggle worm (W)' },
  sprout:  { name: 'Seed packet (G)' },
  glow:    { name: 'Firefly jar (L)' },
};

// Finds are named "kind:key". These three are in your pocket from the start.
export const STARTING_FINDS = ['tool:pencil', 'tool:eraser', 'color:ink'];

export const SIZES = [3, 7, 15, 30];

// Little Margin ends here. Sections inside without a zone are empty street, tunnel or sky.
export const WORLD = { c0: -6, c1: 7, r0: -2, r1: 1 };

// Any colour a line or fill can carry: a paint, a mixed '#rrggbb', or an old colour name.
export function colorHex(name) {
  if (typeof name === 'string' && /^#[0-9a-f]{6}$/i.test(name)) return name;
  return (PAINTS[name] || COLORS[name] || PAINTS.ink).hex;
}

export function findInfo(id) {
  const [kind, key] = id.split(':');
  const table = { color: PAINTS, tool: TOOLS, mod: MODS }[kind];
  const entry = table?.[key];
  if (!entry) return null;
  const noun = { color: 'paint', tool: 'tool', mod: 'magic' }[kind];
  return { id, kind, key, noun, ...entry };
}
