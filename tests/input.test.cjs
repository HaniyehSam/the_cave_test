const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} should equal ${expected}`);

function inputHarness() {
  const events = {};
  const state = { camera: { x: 0, y: 0, zoom: 1.1 }, view: { width: 1000, height: 800 }, mods: {}, found: new Set(), tool: 'pencil', size: 7 };
  const context = {
    state, MODS: {}, markDirty() {}, save() {}, update() {}, toast() {}, hideBubble() {},
    anyDialogOpen: () => false, openJournalDialog() {}, commit() {}, pick: () => false,
    canvas: { focus() {}, setPointerCapture() {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener: (type, fn) => { events[type] = fn; } },
    toWorld: (x,y) => ({ x: state.camera.x + x / state.camera.zoom, y: state.camera.y + y / state.camera.zoom }),
    addEventListener: (type, fn) => { events[type] = fn; }, document: { addEventListener() {} },
  };
  const code = fs.readFileSync(path.join(__dirname, '../public/js/input.js'), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  vm.runInNewContext(code + '\ninitInput();', context);
  const send = (type, props = {}) => events[type]({ preventDefault() {}, button: 0, clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 1, deltaMode: 0, deltaX: 0, deltaY: 0, ...props });
  return { state, send };
}

test('wheel, modified wheel and keys never change canvas scale', () => {
  const { state, send } = inputHarness();
  send('wheel', { deltaY: 110 });
  near(state.camera.y, 100);
  send('wheel', { deltaY: 110, shiftKey: true });
  near(state.camera.x, 100);
  for (const modifier of ['ctrlKey', 'metaKey']) send('wheel', { deltaY: 110, [modifier]: true });
  near(state.camera.y, 300);
  for (const key of ['+', '=', '-', '_']) send('keydown', { key });
  assert.equal(state.camera.zoom, 1.1);
});

test('two fingers pan without zooming or leaving a paint stroke', () => {
  const { state, send } = inputHarness();
  send('pointerdown', { clientX: 100, clientY: 100 });
  send('pointerdown', { pointerId: 2, clientX: 200, clientY: 100 });
  assert.equal(state.active, null);
  send('pointermove', { clientX: 50, clientY: 100 });
  send('pointermove', { pointerId: 2, clientX: 250, clientY: 100 });
  assert.equal(state.camera.x, 0);
  assert.equal(state.camera.zoom, 1.1);
  send('pointermove', { clientX: 50, clientY: 210 });
  send('pointermove', { pointerId: 2, clientX: 250, clientY: 210 });
  near(state.camera.y, -100);
  send('pointerup', { pointerId: 2 });
  send('pointermove', { clientX: 160, clientY: 210 });
  near(state.camera.x, -100);
  assert.equal(state.camera.zoom, 1.1);
});

test('restoring an old zoom preserves position but uses the fixed scale', () => {
  const code = fs.readFileSync(path.join(__dirname, '../public/js/main.js'), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/\bboot\(\);\s*$/, '');
  const state = { mods: {}, camera: { zoom: 1.1 } };
  vm.runInNewContext(code + '\nrestore({camera:{x:765,y:-200,zoom:2.6}});', { state, homeCamera: () => ({ zoom: 1.1 }), STARTING_FINDS: [], findInfo() {}, COLORS: {}, PATTERNS: {}, SIZES: [] });
  assert.equal(state.camera.x, 765);
  assert.equal(state.camera.y, -200);
  assert.equal(state.camera.zoom, 1.1);
});
