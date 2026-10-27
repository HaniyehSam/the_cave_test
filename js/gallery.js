// The gallery wall: every picture visitors have pinned, newest first.
import { GALLERY_ENABLED } from './hosting.js';
const $ = (id) => document.getElementById(id);
const PIN_KEYS = 'paper-world-pin-keys';

function myKeys() {
  try {
    return JSON.parse(localStorage.getItem(PIN_KEYS) || '{}');
  } catch {
    return {};
  }
}
function forgetKey(id) {
  try {
    const keys = myKeys();
    delete keys[id];
    localStorage.setItem(PIN_KEYS, JSON.stringify(keys));
  } catch { /* fine */ }
}

// A stable little tilt per picture, so the wall looks hand-hung.
const turn = (id) => ([...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 7) - 3;
const when = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const meta = (p) => [`by ${p.author}`, p.place, when(p.created)].filter(Boolean).join(' · ');

function open(p) {
  $('closerImg').src = p.src;
  $('closerImg').alt = p.title;
  $('closerTitle').textContent = p.title;
  $('closerMeta').textContent = meta(p);
  $('closerDownload').href = p.src;
  const key = myKeys()[p.id];
  $('closerDelete').hidden = !key;
  $('closerDelete').onclick = async () => {
    const res = await fetch(`api/gallery/${p.id}`, { method: 'DELETE', headers: { 'X-Delete-Key': key } });
    if (res.ok) {
      forgetKey(p.id);
      $('closer').close();
      load();
    }
  };
  $('closer').showModal();
}

async function load() {
  if (!GALLERY_ENABLED) {
    $('summary').textContent = 'The shared gallery is unavailable on this hosted version. You can still download your paintings as PNG files.';
    return;
  }
  let pins = [];
  try {
    pins = await (await fetch('api/gallery')).json();
  } catch {
    $('summary').textContent = 'The wall could not be reached. Is the server running?';
    return;
  }
  const wall = $('wall');
  wall.replaceChildren();
  $('empty').hidden = pins.length > 0;
  $('summary').textContent = pins.length ? `${pins.length} picture${pins.length === 1 ? '' : 's'} painted in Endless Canvas.` : 'Pictures people painted in Endless Canvas.';
  for (const p of pins) {
    const fig = document.createElement('figure');
    fig.className = 'pin';
    fig.tabIndex = 0;
    fig.style.setProperty('--turn', `${turn(p.id)}deg`);
    const img = document.createElement('img');
    img.src = p.src;
    img.alt = p.title;
    img.loading = 'lazy';
    const h = document.createElement('h2');
    h.textContent = p.title;
    const m = document.createElement('p');
    m.textContent = meta(p);
    fig.append(img, h, m);
    fig.onclick = () => open(p);
    fig.onkeydown = (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open(p));
    wall.append(fig);
  }
}

document.querySelector('#closer .close').onclick = () => $('closer').close();
$('closer').addEventListener('click', (e) => e.target === $('closer') && $('closer').close());
load();
