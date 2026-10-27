// Boot: restore the visitor's world, then start drawing frames.
import { COLORS, PATTERNS, SIZES, STARTING_FINDS, findInfo } from './config.js';
import { state, homeCamera, markDirty } from './state.js';
import { load, save, storageWorks } from './store.js';
import { loadPainting, talk } from './actions.js';
import { refreshAllReveals, zoneById, loadCredits } from './world.js';
import { startLoop, resize } from './render.js';
import { initUI, onFrame, toast, hideBubble } from './ui.js';
import { initInput } from './input.js';

function restore(saved) {
  if (!saved) return false;
  state.strokes = Array.isArray(saved.strokes) ? saved.strokes : [];
  state.found = new Set([...STARTING_FINDS, ...(saved.found || []).filter(findInfo)]);
  state.fresh = new Set((saved.fresh || []).filter((id) => state.found.has(id)));
  state.secrets = new Set(saved.secrets || []);
  state.talked = saved.talked || {};
  state.visited = new Set(saved.visited || []);
  const cam = saved.camera;
  if (cam && [cam.x, cam.y].every(Number.isFinite)) {
    state.camera = { x: cam.x, y: cam.y, zoom: homeCamera().zoom };
  }
  if (state.found.has(`color:${saved.color}`) && COLORS[saved.color]) state.color = saved.color;
  if (PATTERNS[saved.pattern]) state.pattern = saved.pattern;
  if (SIZES.includes(saved.size)) state.size = saved.size;
  if (state.found.has(`tool:${saved.tool}`)) state.tool = saved.tool;
  for (const k of Object.keys(state.mods)) state.mods[k] = !!saved.mods?.[k] && state.found.has(`mod:${k}`);
  return true;
}

// Glide home without changing the viewing scale.
let flight = 0;
function flyTo(target) {
  const from = { ...state.camera }, id = ++flight, start = performance.now();
  const dist = Math.hypot(target.x - from.x, target.y - from.y), ms = Math.min(1600, 500 + dist * 0.4);
  hideBubble();
  const step = (now) => {
    if (id !== flight) return;
    const t = Math.min(1, (now - start) / ms), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    state.camera = {
      x: from.x + (target.x - from.x) * e,
      y: from.y + (target.y - from.y) * e,
      zoom: from.zoom,
    };
    markDirty();
    if (t < 1) requestAnimationFrame(step);
    else save();
  };
  requestAnimationFrame(step);
}

const goHome = () => flyTo(homeCamera());

async function boot() {
  resize();
  addEventListener('resize', resize);
  initInput();
  const returning = restore(await load());
  await loadPainting(state.strokes);
  await refreshAllReveals();
  loadCredits();
  initUI({ goHome });
  startLoop(onFrame);
  if (!storageWorks()) toast('This browser cannot save. Download a picture before you leave.', 7000);
  // First visit: a neighbour says hello.
  if (!returning) {
    const home = zoneById('home');
    const host = home?.residents.find((r) => r.id === 'ondine');
    if (host) setTimeout(() => talk(home, host), 900);
  }
}

boot();
