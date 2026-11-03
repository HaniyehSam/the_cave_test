import { GALLERY_ENABLED } from './hosting.js';
// The dock of tools, the colour and magic trays, the mixing dish, credits, speech bubbles.
// No scores, counters or badges: the town itself shows what you have done.
import { PAINTS, MODS, SIZES, SECTION, colorHex } from './config.js';
import { state, markDirty } from './state.js';
import { zoneAtPoint, zoneById, allCredits } from './world.js';
import { toScreen, canvas, render } from './render.js';
import { hooks, undo, redo, resetAll, talk } from './actions.js';
import { save } from './store.js';
import { RECIPES, mixName } from './mix.js';
import { nearestIdea, ideaKey } from './ideas.js';

const $ = (id) => document.getElementById(id);

// ---------- Toasts and bubbles ----------
// Toasts are only for things going wrong, like a browser that cannot save.

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

let lastPlace = undefined;
let quietTimer = 0;
function updatePlace() {
  const zone = zoneAtPoint(state.camera.x, state.camera.y);
  if (zone.id === lastPlace) return;
  lastPlace = zone.id;
  if (!zone.empty && !state.visited.has(zone.id)) {
    state.visited.add(zone.id);
    save();
  }
  $('placeName').textContent = zone.name;
  $('place').classList.toggle('quiet', !zone.name);
  clearTimeout(quietTimer);
  quietTimer = setTimeout(() => $('place').classList.add('quiet'), 5000);
}

// ---------- Going somewhere to draw ----------

let fly = () => {};

function goToIdea() {
  const found = nearestIdea(state.camera.x, state.camera.y, 3);
  if (!found) {
    // Nothing left nearby: the bulb just gives a little shrug.
    $('ideaBtn').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(0)' }], 420);
    return;
  }
  const { box } = found;
  fly({ x: box.x + box.w / 2, y: box.y + box.h / 2 });
}

// ---------- Dock ----------

function button(label, onClick, pressed) {
  const b = document.createElement('button');
  b.setAttribute('aria-label', label);
  b.title = label;
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

const paintsOwned = () => Object.keys(PAINTS).filter((k) => state.found.has(`color:${k}`) && !PAINTS[k].mixOnly);
const allColours = () => [...paintsOwned(), ...state.mixes];
const colourLabel = (key) => PAINTS[key]?.name || mixName(key);
const isCurrent = (key) => state.color === key && state.tool !== 'eraser';

function chooseColour(key) {
  state.color = key;
  if (state.tool === 'eraser') state.tool = 'pencil';
  update();
  save();
}
export function pickColour(i) {
  const list = allColours();
  if (list[i]) chooseColour(list[i]);
}

function swatch(key, onPick, pressed) {
  const b = button(colourLabel(key), onPick, pressed);
  b.className = 'swatch' + (key === 'rainbow' ? ' rainbow' : '');
  b.style.setProperty('--pigment', colorHex(key));
  return b;
}
const swatches = (close) => allColours().map((k) => swatch(k, () => {
  chooseColour(k);
  if (close) closeTrays();
}, isCurrent(k)));

// ---------- Trays ----------

let tray = null;   // 'colour' or 'magic' while one is open

const MOD_ICONS = {
  mirror: '<path d="M12 3v18M8 7 4 12l4 5M16 7l4 5-4 5"/>',
  kaleido: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><circle cx="12" cy="12" r="3"/>',
  wiggle: '<path d="M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0"/>',
  sprout: '<path d="M12 21v-9M12 12c0-4 3-6 7-6 0 4-3 6-7 6M12 15c0-3-2-5-6-5 0 3 2 5 6 5"/>',
  glow: '<path d="M9 7h6l1 3v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9zM9 4h6M12 13v2M4 9l2 1M20 9l-2 1M5 15h2M17 15h2"/>',
};
const DISH_ICON = '<svg viewBox="0 0 24 24"><path d="M3 11h18c0 4.5-4 8-9 8s-9-3.5-9-8z"/><circle cx="7.5" cy="7" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="16.5" cy="7" r="1.6"/></svg>';

function toggleMod(key) {
  const on = !state.mods[key];
  state.mods[key] = on;
  // Symmetries exclude each other, and so do the two living lines.
  if (on && key === 'mirror') state.mods.kaleido = false;
  if (on && key === 'kaleido') state.mods.mirror = false;
  if (on && key === 'wiggle') state.mods.sprout = false;
  if (on && key === 'sprout') state.mods.wiggle = false;
  if (on && state.tool !== 'pencil') state.tool = 'pencil';
  update();
  markDirty();
  save();
}

function buildTray() {
  const box = $('trayBody');
  if (tray === 'magic') {
    box.replaceChildren(...Object.keys(MODS).filter((k) => state.found.has(`mod:${k}`)).map((key) => {
      const b = button(MODS[key].name, () => toggleMod(key), state.mods[key]);
      b.className = 'magic';
      b.innerHTML = `<svg viewBox="0 0 24 24">${MOD_ICONS[key]}</svg>`;
      return b;
    }));
    return;
  }
  const row = document.createElement('div');
  row.className = 'swatches';
  row.append(...swatches(true));
  if (state.found.has('tool:dish')) {
    const dish = button('Mixing dish (X)', openDish);
    dish.className = 'dish-open';
    dish.innerHTML = DISH_ICON;
    row.append(dish);
  }
  box.replaceChildren(row);
}

export function toggleTray(name) {
  if (tray === name) return closeTrays();
  const anchor = $(name === 'magic' ? 'magicBtn' : 'colourBtn');
  if (!anchor || anchor.hidden || !anchor.offsetParent) return;
  tray = name;
  const el = $('tray');
  el.hidden = false;
  buildTray();
  const a = anchor.getBoundingClientRect(), dock = $('dock').getBoundingClientRect();
  el.style.left = `${Math.min(innerWidth - el.offsetWidth - 10, Math.max(10, a.left + a.width / 2 - el.offsetWidth / 2))}px`;
  el.style.bottom = `${innerHeight - dock.top + 10}px`;
  for (const b of document.querySelectorAll('[data-tray]')) b.setAttribute('aria-expanded', String(b.dataset.tray === name));
}
export function closeTrays() {
  tray = null;
  $('tray').hidden = true;
  for (const b of document.querySelectorAll('[data-tray]')) b.setAttribute('aria-expanded', 'false');
}

// ---------- Mixing dish ----------
// Only a few recipes, and only for paints you have. Tap one to keep its colour.

function blob(hex) {
  const s = document.createElement('span');
  s.className = 'blob';
  s.style.background = hex;
  return s;
}

function buildDish() {
  const list = $('recipes');
  list.replaceChildren();
  for (const r of RECIPES) {
    if (!state.found.has(`color:${r.a}`) || !state.found.has(`color:${r.b}`)) continue;
    const kept = state.mixes.includes(r.hex);
    const b = button(r.name, () => keepMix(r), kept);
    b.className = 'recipe';
    b.append(blob(PAINTS[r.a].hex), Object.assign(document.createElement('i'), { textContent: '+' }), blob(PAINTS[r.b].hex),
      Object.assign(document.createElement('i'), { textContent: '=' }), blob(r.hex));
    list.append(b);
  }
}

export function openDish() {
  if (!state.found.has('tool:dish')) return;
  closeTrays();
  buildDish();
  $('dishDialog').showModal();
}

function keepMix(r) {
  if (!state.mixes.includes(r.hex)) state.mixes.push(r.hex);
  $('dishDialog').close();
  chooseColour(r.hex);
}

// ---------- Story cave ----------
// After a panel is drawn, the visitor says what it is, and the story goes on with their word.

let telling = null;
const cleanWord = (s) => s.replace(/[<>]/g, '').trim().replace(/^(a|an|the|some)\s+/i, '').slice(0, 24).trim();

function askWord(zone, idea) {
  telling = { zone, idea };
  $('wordLine').textContent = idea.text.replace('{a}', 'a ____').replace('{w}', '____');
  $('wordInput').value = '';
  $('wordDialog').showModal();
}

function tellStory() {
  if (!telling) return;
  const { zone, idea } = telling;
  telling = null;
  const word = state.words[ideaKey(zone, idea)];
  const teller = zone.residents.find((r) => r.id === idea.teller);
  if (teller && idea.react) {
    showBubble({
      name: teller.name,
      text: idea.react.replaceAll('{w}', word || 'that'),
      wx: zone.col * SECTION + teller.x,
      wy: zone.row * SECTION + teller.y - (teller.h || 80),
    });
  }
  markDirty();
  save();
}

// ---------- Update ----------

export function update() {
  for (const b of document.querySelectorAll('[data-tool]')) {
    const tool = b.dataset.tool;
    b.hidden = !state.found.has(`tool:${tool}`);
    b.setAttribute('aria-pressed', String(state.tool === tool && !state.moving));
  }
  $('palette').replaceChildren(...swatches(false));
  $('dishBtn').hidden = !state.found.has('tool:dish');
  $('colourDot').style.background = colorHex(state.color);
  $('colourDot').classList.toggle('rainbow', state.color === 'rainbow');
  const owned = Object.keys(MODS).filter((k) => state.found.has(`mod:${k}`));
  $('magicBtn').hidden = !owned.length;
  $('magicBtn').classList.toggle('on', owned.some((k) => state.mods[k]));
  if (tray) buildTray();
  const dot = 4 + SIZES.indexOf(state.size) * 4;
  $('sizeDot').style.width = $('sizeDot').style.height = `${dot}px`;
  $('sizeDot').style.background = state.color === 'rainbow' ? '' : colorHex(state.color);
  $('sizeDot').classList.toggle('rainbow', state.color === 'rainbow');
  $('moveBtn').setAttribute('aria-pressed', String(state.moving));
  $('undoBtn').disabled = !state.strokes.length;
  $('redoBtn').disabled = !state.redo.length;
  canvas.classList.toggle('moving', state.moving);
  lastPlace = undefined;
  updatePlace();
}

// ---------- Credits ----------

function openCredits() {
  closeTrays();
  const list = $('creditList');
  list.replaceChildren(...allCredits().map((c) => {
    const li = document.createElement('li');
    const a = Object.assign(document.createElement('a'), { href: c.page, target: '_blank', rel: 'noopener', textContent: c.title });
    li.append(a, ` · ${c.source}, ${c.licence}`);
    return li;
  }));
  $('creditsDialog').showModal();
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
  $('exportStatus').textContent = '…';
  const blob = await new Promise((r) => snapshot().toBlob(r, 'image/png'));
  if (!blob) {
    $('exportStatus').textContent = 'That did not work. Try again.';
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'little-margin.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 20000);
  $('exportStatus').textContent = '';
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
  const status = $('exportStatus');
  $('pinBtn').disabled = true;
  status.textContent = '…';
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
    status.innerHTML = '<a href="gallery.html">On the wall →</a>';
    $('pinTitle').value = '';
  } catch (err) {
    status.textContent = err.message || 'The wall would not take it. Try again.';
  } finally {
    $('pinBtn').disabled = false;
  }
}

// ---------- Wiring ----------

export function initUI({ goHome, flyTo }) {
  if (!GALLERY_ENABLED) {
    const gallery = document.getElementById('galleryBtn');
    if (gallery) gallery.hidden = true;
    $('pinBtn').hidden = true;
    $('pinBtn').disabled = true;
    for (const label of $('pinForm').querySelectorAll('label')) label.hidden = true;
  }
  fly = flyTo;
  hooks.changed = update;
  hooks.bubble = showBubble;
  hooks.storyPanel = askWord;
  for (const b of document.querySelectorAll('[data-tool]')) b.onclick = () => chooseTool(b.dataset.tool);
  for (const b of document.querySelectorAll('[data-tray]')) b.onclick = () => toggleTray(b.dataset.tray);
  $('dishBtn').onclick = openDish;
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
  $('ideaBtn').onclick = goToIdea;
  $('creditsBtn').onclick = openCredits;
  $('exportBtn').onclick = () => {
    closeTrays();
    $('exportStatus').textContent = '';
    try { $('pinAuthor').value ||= localStorage.getItem('paper-world-author') || ''; } catch { /* fine */ }
    $('exportDialog').showModal();
  };
  $('downloadBtn').onclick = download;
  $('pinForm').onsubmit = pin;
  $('startAgain').onclick = () => {
    $('creditsDialog').close();
    $('resetDialog').showModal();
  };
  $('confirmReset').onclick = async () => {
    await resetAll();
    hideBubble();
    $('resetDialog').close();
    // A new arrival on the midnight train.
    const station = zoneById('station'), host = station?.residents.find((r) => r.id === 'heron');
    if (host) setTimeout(() => talk(station, host), 600);
  };
  $('wordForm').onsubmit = (e) => {
    e.preventDefault();
    const word = cleanWord($('wordInput').value);
    if (word && telling) state.words[ideaKey(telling.zone, telling.idea)] = word;
    $('wordDialog').close();
  };
  $('wordDialog').addEventListener('close', tellStory);
  for (const b of document.querySelectorAll('[data-close]')) b.onclick = () => b.closest('dialog').close();
  // A tap anywhere else closes an open tray.
  addEventListener('pointerdown', (e) => {
    if (tray && !e.target.closest('#tray, [data-tray]')) closeTrays();
  });
  update();
}

export const anyDialogOpen = () => [...document.querySelectorAll('dialog')].some((d) => d.open);

// Called after every rendered frame.
export function onFrame() {
  placeBubble();
  updatePlace();
}
