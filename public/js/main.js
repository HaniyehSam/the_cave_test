// Boot: restore the visitor's world, then start drawing frames.
import { PAINTS, SIZES, STARTING_FINDS, findInfo } from './config.js';
import { state, homeCamera, markDirty, clampCamera } from './state.js';
import { isMix } from './mix.js';
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
  state.secrets = new Set(saved.secrets || []);
  state.ideas = new Set(saved.ideas || []);
  state.words = saved.words && typeof saved.words === 'object' ? saved.words : {};
  state.mixes = (saved.mixes || []).filter(isMix);
  state.paraded = !!saved.paraded;
  state.talked = saved.talked || {};
  state.visited = new Set(saved.visited || []);
  const cam = saved.camera;
  if (cam && [cam.x, cam.y].every(Number.isFinite)) state.camera = clampCamera(cam);
  if ((state.found.has(`color:${saved.color}`) && PAINTS[saved.color] && !PAINTS[saved.color].mixOnly) || state.mixes.includes(saved.color)) state.color = saved.color;
  if (SIZES.includes(saved.size)) state.size = saved.size;
  if (state.found.has(`tool:${saved.tool}`)) state.tool = saved.tool;
  for (const k of Object.keys(state.mods)) state.mods[k] = !!saved.mods?.[k] && state.found.has(`mod:${k}`);
  return true;
}

// Glide the camera somewhere. The zoom never changes on the way.
let flight = 0;
function flyTo(to) {
  const target = clampCamera(to);
  const from = { ...state.camera }, id = ++flight, start = performance.now();
  const dist = Math.hypot(target.x - from.x, target.y - from.y), ms = Math.min(1600, 500 + dist * 0.4);
  hideBubble();
  const step = (now) => {
    if (id !== flight) return;
    const t = Math.min(1, (now - start) / ms), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    state.camera = clampCamera({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e });
    markDirty();
    if (t < 1) requestAnimationFrame(step);
    else save();
  };
  requestAnimationFrame(step);
}

const goHome = () => flyTo(homeCamera());

async function boot() {
  resize();
  addEventListener('resize', () => {
    resize();
    state.camera = clampCamera(state.camera);   // a phone-sized window gets the phone zoom
  });
  initInput();
  const returning = restore(await load());
  await loadPainting(state.strokes);
  await refreshAllReveals();
  loadCredits();
  initUI({ goHome, flyTo });
  startLoop(onFrame);
  if (!storageWorks()) toast('This browser cannot save. Download a picture before you leave.', 7000);
  // First visit: off the midnight train, and the stationmaster is waiting.
  if (!returning) {
    const station = zoneById('station');
    const host = station?.residents.find((r) => r.id === 'heron');
    if (host) setTimeout(() => talk(station, host), 900);
  }
}

boot();
