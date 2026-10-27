// Shared constants and the catalogue of everything a visitor can find.

export const SECTION = 960;      // world units per section; zones are one section each
export const PAPER = '#f8f7f2';
export const INK = '#292824';
export const GROUND = 700;       // pavement line of every street section

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

export const PATTERNS = {
  solid:       { name: 'Plain' },
  stripes:     { name: 'Stripes' },
  dots:        { name: 'Polka dots' },
  checks:      { name: 'Checks' },
  waves:       { name: 'Waves' },
  stars:       { name: 'Stars' },
  bricks:      { name: 'Bricks' },
  confetti:    { name: 'Confetti' },
  swirls:      { name: 'Swirls' },
  scales:      { name: 'Fish scales' },
  herringbone: { name: 'Herringbone' },
};

export const TOOLS = {
  pencil: { name: 'Pencil' },
  eraser: { name: 'Eraser' },
  fill:   { name: 'Paint tin', hint: 'Fills any closed shape, even ones you draw.' },
};

export const MODS = {
  mirror:  { name: 'Hand mirror', hint: 'Lines are mirrored across the middle of your screen. (M)' },
  kaleido: { name: 'Kaleidoscope', hint: 'Six-way patterns around the middle of your screen. (K)' },
  wiggle:  { name: 'Wiggle worm', hint: 'Lines that never quite sit still. (W)' },
  sprout:  { name: 'Seed packet', hint: 'Lines sprout leaves and little flowers. (G)' },
  rainbow: { name: 'Rainbow ribbon', hint: 'Lines run through every colour there is. (R)' },
  glow:    { name: 'Firefly jar', hint: 'Lines glow softly, like they are lit from inside. (L)' },
};

// Finds are named "kind:key". These three are in your pocket from the start.
export const STARTING_FINDS = ['tool:pencil', 'tool:eraser', 'color:ink'];

export const SIZES = [3, 7, 15, 30];

export function findInfo(id) {
  const [kind, key] = id.split(':');
  const table = { color: COLORS, pattern: PATTERNS, tool: TOOLS, mod: MODS }[kind];
  const entry = table?.[key];
  if (!entry) return null;
  const noun = { color: 'paint', pattern: 'pattern', tool: 'tool', mod: 'magic' }[kind];
  return { id, kind, key, noun, ...entry };
}
