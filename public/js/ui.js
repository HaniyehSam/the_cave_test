// The pocket of tools, the journal, toasts and speech bubbles.
import { COLORS, PATTERNS, MODS, SIZES } from './config.js';
import { state, markDirty } from './state.js';
import { zoneAtPoint, allCredits, loadCredits } from './world.js';
import { patternTile } from './paint.js';
import { toScreen, canvas, render } from './render.js';
import { hooks, undo, redo, resetAll } from './actions.js';
import { save } from './store.js';
import { GALLERY_ENABLED } from './hosting.js';

const $ = (id) => document.getElementById(id);

// ---------- Toasts and bubbles ----------

let toastTimer = 0;
export function toast(text, ms = 4200) {
  $('toast').textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('toast').textContent = ''), ms);
}

let bubble = null;
let bubbleTimer = 0;
export function showBubble(b) {
  bubble = b;
  $('bubbleName').textContent = b.name;
  $('bubbleText').textContent = b.text;
  const el = $('bubble');
  el.hidden = false;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(hideBubble, 6500 + b.text.length * 40);
  placeBubble();
}
export function hideBubble() {
  bubble = null;
  $('bubble').hidden = true;
}
function placeBubble() {
  if (!bubble) return;
  const el = $('bubble'), p = toScreen(bubble.wx, bubble.wy);
  // The speaker walked off screen: the conversation is over.
  if (p.x < -60 || p.x > innerWidth + 60 || p.y < -60 || p.y > innerHeight + 60) return hideBubble();
  const x = Math.min(innerWidth - el.offsetWidth - 10, Math.max(10, p.x - 12));
  const y = Math.min(innerHeight - el.offsetHeight - 90, Math.max(60, p.y - el.offsetHeight - 6));
  el.style.transform = `translate(${x}px, ${y}px)`;
}

// ---------- Where am I ----------

let lastZone = undefined;
let quietTimer = 0;
function updatePlace() {
  const zone = zoneAtPoint(state.camera.x, state.camera.y);
  const id = zone?.id ?? null;
  if (id === lastZone) return;
  lastZone = id;
  if (!zone.generated && !state.visited.has(zone.id)) {
    state.visited.add(zone.id);
    save();
  }
  $('placeName').textContent = zone.name;
  $('placeFinds').textContent = findsLine(zone);
  $('place').classList.remove('quiet');
  clearTimeout(quietTimer);
  quietTimer = setTimeout(() => $('place').classList.add('quiet'), 5000);
}
const findsLine = (zone) => (zone.generated ? 'the outskirts' : `${zone.finds.filter((f) => state.found.has(f.id)).length} / ${zone.finds.length} found`);

// ---------- Pocket ----------

function button(label, title, onClick, pressed) {
  const b = document.createElement('button');
  b.setAttribute('aria-label', label);
  b.title = title;
  b.setAttribute('aria-pressed', String(!!pressed));
  b.onclick = onClick;
  return b;
}

function chooseTool(tool) {
  state.tool = tool;
  state.moving = false;
  update();
  save();
}

function trying(id) {
  if (state.fresh.delete(id)) save();
}

function buildPalette() {
  const box = $('palette');
  box.replaceChildren();
  for (const [key, c] of Object.entries(COLORS)) {
    const id = `color:${key}`;
    if (!state.found.has(id)) continue;
    const b = button(`${c.name} paint`, c.name, () => {
      state.color = key;
      if (state.tool === 'eraser') state.tool = 'pencil';
      trying(id);
      update();
      save();
    }, state.color === key && state.tool !== 'eraser');
    b.style.setProperty('--pigment', c.hex);
    if (state.fresh.has(id)) b.classList.add('new');
    box.append(b);
  }
}

function buildPatterns() {
  const box = $('patterns');
  box.replaceChildren();
  const owned = Object.keys(PATTERNS).filter((k) => k === 'solid' || state.found.has(`pattern:${k}`));
  box.hidden = state.tool !== 'fill' || owned.length < 2;
  for (const key of owned) {
    const id = `pattern:${key}`;
    const b = button(PATTERNS[key].name, `${PATTERNS[key].name} fill`, () => {
      state.pattern = key;
      trying(id);
      update();
      save();
    }, state.pattern === key);
    const c = document.createElement('canvas');
    c.width = c.height = 26;
    const x = c.getContext('2d');
    x.fillStyle = '#fffdf8';
    x.fillRect(0, 0, 26, 26);
    x.fillStyle = x.createPattern(patternTile(key, state.color, 13), 'repeat');
    x.fillRect(0, 0, 26, 26);
    b.append(c);
    if (state.fresh.has(id)) b.classList.add('new');
    box.append(b);
  }
}

const MOD_ICONS = {
  mirror: '<path d="M12 3v18M8 7 4 12l4 5M16 7l4 5-4 5"/>',
  kaleido: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><circle cx="12" cy="12" r="3"/>',
  wiggle: '<path d="M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0"/>',
  sprout: '<path d="M12 21v-9M12 12c0-4 3-6 7-6 0 4-3 6-7 6M12 15c0-3-2-5-6-5 0 3 2 5 6 5"/>',
  rainbow: '<path d="M3 18a9 9 0 0 1 18 0M6.5 18a5.5 5.5 0 0 1 11 0M10 18a2 2 0 0 1 4 0"/>',
  glow: '<path d="M9 7h6l1 3v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9zM9 4h6M12 13v2M4 9l2 1M20 9l-2 1M5 15h2M17 15h2"/>',
};

function toggleMod(key) {
  const on = !state.mods[key];
  state.mods[key] = on;
  // Symmetries exclude each other, and so do the two living lines.
  if (on && key === 'mirror') state.mods.kaleido = false;
  if (on && key === 'kaleido') state.mods.mirror = false;
  if (on && key === 'wiggle') state.mods.sprout = false;
  if (on && key === 'sprout') state.mods.wiggle = false;
  if (on && state.tool !== 'pencil') state.tool = 'pencil';
  trying(`mod:${key}`);
  update();
  markDirty();
  save();
}

function buildMods() {
  const box = $('mods');
  box.replaceChildren();
  const owned = Object.keys(MODS).filter((k) => state.found.has(`mod:${k}`));
  box.hidden = owned.length === 0;
  for (const key of owned) {
    const b = button(MODS[key].name, `${MODS[key].name}: ${MODS[key].hint}`, () => toggleMod(key), state.mods[key]);
    b.innerHTML = `<svg viewBox="0 0 24 24">${MOD_ICONS[key]}</svg>`;
    if (state.fresh.has(`mod:${key}`)) b.classList.add('new');
    box.append(b);
  }
}

export function update() {
  for (const b of document.querySelectorAll('[data-tool]')) {
    const tool = b.dataset.tool;
    b.hidden = !state.found.has(`tool:${tool}`);
    b.setAttribute('aria-pressed', String(state.tool === tool && !state.moving));
    b.classList.toggle('new', state.fresh.has(`tool:${tool}`));
  }
  buildPalette();
  buildPatterns();
  buildMods();
  const dot = 4 + SIZES.indexOf(state.size) * 4;
  $('sizeDot').style.width = $('sizeDot').style.height = `${dot}px`;
  $('sizeDot').style.background = COLORS[state.color]?.hex;
  $('moveBtn').setAttribute('aria-pressed', String(state.moving));
  $('undoBtn').disabled = !state.strokes.length;
  $('redoBtn').disabled = !state.redo.length;
  canvas.classList.toggle('moving', state.moving);
  canvas.classList.toggle('filling', state.tool === 'fill' && !state.moving);
  lastZone = undefined;
  updatePlace();
}

// ---------- Journal ----------

async function openJournal() {
  const body = $('journalBody');
  body.replaceChildren();
  if (!allCredits().length) await loadCredits();
  const credits = allCredits();
  if (credits.length) {
    const more = document.createElement('section');
    more.className = 'credits';
    more.innerHTML = '<p>Where the photos come from</p>';
    const list = document.createElement('ul');
    for (const c of credits) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = c.page;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = c.title;
      li.append(a, ` · ${c.source}, ${c.licence}`);
      list.append(li);
    }
    more.append(list);
    body.append(more);
  }
  $('journal').showModal();
}

// ---------- Export ----------

// The current view as a picture, at most `max` pixels on its longest side.
function snapshot(max = Infinity) {
  const view = { ...state.view };
  const k = Math.min(view.dpr, max / Math.max(view.width, view.height));
  const out = document.createElement('canvas');
  out.width = Math.round(view.width * k);
  out.height = Math.round(view.height * k);
  render(out.getContext('2d'), { ...view, dpr: k }, state.camera);
  return out;
}

async function download() {
  $('exportStatus').textContent = 'Drawing…';
  const blob = await new Promise((r) => snapshot().toBlob(r, 'image/png'));
  if (!blob) {
    $('exportStatus').textContent = 'That did not work. Try again.';
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'endless-canvas.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 20000);
  $('exportStatus').textContent = 'Saved.';
}

// Pin keys stay in this browser, so you (and only you) can take your pictures down again.
const PIN_KEYS = 'paper-world-pin-keys';
function rememberPin(id, key) {
  try {
    const keys = JSON.parse(localStorage.getItem(PIN_KEYS) || '{}');
    keys[id] = key;
    localStorage.setItem(PIN_KEYS, JSON.stringify(keys));
  } catch { /* storage blocked: the pin just cannot be deleted from here */ }
}

async function pin(e) {
  e.preventDefault();
  if (!GALLERY_ENABLED) return;
  const status = $('exportStatus');
  $('pinBtn').disabled = true;
  status.textContent = 'Pinning…';
  try {
    const blob = await new Promise((r) => snapshot(1600).toBlob(r, 'image/webp', 0.86));
    const image = await new Promise((r) => {
      const reader = new FileReader();
      reader.onload = () => r(reader.result);
      reader.readAsDataURL(blob);
    });
    const zone = zoneAtPoint(state.camera.x, state.camera.y);
    const res = await fetch('api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, title: $('pinTitle').value, author: $('pinAuthor').value, place: zone?.name || '' }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'The wall would not take it. Try again.');
    rememberPin(body.id, body.deleteKey);
    try { localStorage.setItem('paper-world-author', $('pinAuthor').value); } catch { /* fine */ }
    status.innerHTML = 'Pinned! <a href="gallery.html">See it on the wall →</a>';
    $('pinTitle').value = '';
  } catch (err) {
    status.textContent = err.message || 'The wall would not take it. Try again.';
  } finally {
    $('pinBtn').disabled = false;
  }
}

// ---------- Wiring ----------

export function initUI({ goHome }) {
  if (!GALLERY_ENABLED) {
    $('galleryBtn').hidden = true;
    $('pinBtn').hidden = true;
    $('pinBtn').disabled = true;
    for (const label of $('pinForm').querySelectorAll('label')) label.hidden = true;
    $('exportBtn').title = 'Save a picture';
    $('exportBtn').setAttribute('aria-label', 'Save a picture');
  }
  hooks.toast = toast;
  hooks.changed = update;
  hooks.bubble = showBubble;
  for (const b of document.querySelectorAll('[data-tool]')) b.onclick = () => {
    trying(`tool:${b.dataset.tool}`);
    chooseTool(b.dataset.tool);
  };
  $('sizeBtn').onclick = () => {
    state.size = SIZES[(SIZES.indexOf(state.size) + 1) % SIZES.length];
    update();
    save();
  };
  $('moveBtn').onclick = () => {
    state.moving = !state.moving;
    update();
  };
  $('undoBtn').onclick = undo;
  $('redoBtn').onclick = redo;
  $('homeBtn').onclick = goHome;
  $('journalBtn').onclick = openJournal;
  $('exportBtn').onclick = () => {
    $('exportStatus').textContent = '';
    try { $('pinAuthor').value ||= localStorage.getItem('paper-world-author') || ''; } catch { /* fine */ }
    $('exportDialog').showModal();
  };
  $('downloadBtn').onclick = download;
  $('pinForm').onsubmit = pin;
  $('resetBtn').onclick = () => $('resetDialog').showModal();
  $('confirmReset').onclick = async () => {
    await resetAll();
    hideBubble();
    $('resetDialog').close();
    toast('A clean sheet.');
  };
  for (const b of document.querySelectorAll('[data-close]')) b.onclick = () => b.closest('dialog').close();
  update();
}

export const openJournalDialog = openJournal;
export const anyDialogOpen = () => [...document.querySelectorAll('dialog')].some((d) => d.open);

// Called after every rendered frame.
export function onFrame() {
  placeBubble();
  updatePlace();
}
