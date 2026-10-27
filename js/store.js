// Saves the visitor's world in IndexedDB, in their own browser only.
import { state } from './state.js';

const DB = 'paper-world-v2';
let db = null;
let timer = 0;

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('book');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run(mode, op) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('book', mode);
    const req = op(tx.objectStore('book'));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

// Strokes carry cached canvases at runtime; only plain data is stored.
const plain = (s) => Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith('_')));

function snapshot() {
  return {
    strokes: state.strokes.map(plain),
    found: [...state.found],
    fresh: [...state.fresh],
    secrets: [...state.secrets],
    talked: state.talked,
    visited: [...state.visited],
    camera: state.camera,
    tool: state.tool,
    color: state.color,
    pattern: state.pattern,
    size: state.size,
    mods: state.mods,
  };
}

export async function load() {
  try {
    db = await open();
    return (await run('readonly', (s) => s.get('state'))) || null;
  } catch {
    db = null;
    return null;
  }
}

export function save(now = false) {
  clearTimeout(timer);
  if (!db) return Promise.resolve(false);
  const write = () => run('readwrite', (s) => s.put(snapshot(), 'state')).then(() => true, () => false);
  if (now) return write();
  timer = setTimeout(write, 400);
  return Promise.resolve(true);
}

export const storageWorks = () => !!db;
