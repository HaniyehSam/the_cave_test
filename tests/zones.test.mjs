// Checks every hand-made zone is well formed, so new zones cannot quietly break the world.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ZONES } from '../public/js/zones/index.js';
import { findInfo, STARTING_FINDS, SECTION } from '../public/js/config.js';
import { outskirtsZone } from '../public/js/zones/outskirts.js';

const clean = (svg, where) => {
  assert.match(svg, /^<svg /, `${where} is not an SVG document`);
  assert.doesNotMatch(svg, /NaN|undefined|\[object/, `${where} contains a broken value`);
};

test('zones have unique ids and cells', () => {
  assert.equal(new Set(ZONES.map((z) => z.id)).size, ZONES.length);
  assert.equal(new Set(ZONES.map((z) => `${z.col},${z.row}`)).size, ZONES.length);
});

test('zone artwork builds cleanly', () => {
  for (const z of ZONES) {
    clean(z.art(), `${z.id} art`);
    if (z.wash) clean(z.wash(), `${z.id} wash`);
    for (const s of z.secrets) assert.doesNotMatch(s.reveal(), /NaN|undefined/, `${z.id}:${s.id} reveal`);
  }
});

test('finds are real, unique, reachable and inside their zone', () => {
  const seen = new Set(STARTING_FINDS);
  for (const z of ZONES) {
    const secrets = new Set(z.secrets.map((s) => s.id));
    for (const f of z.finds) {
      assert.ok(findInfo(f.id), `${z.id}: unknown find ${f.id}`);
      assert.ok(!seen.has(f.id), `${f.id} appears twice`);
      seen.add(f.id);
      assert.ok(f.x > 0 && f.x < SECTION && f.y > 0 && f.y < SECTION, `${f.id} is outside ${z.id}`);
      if (f.hidden) assert.ok(secrets.has(f.hidden), `${f.id} waits for missing secret ${f.hidden}`);
    }
  }
});

test('every photo a zone uses exists, is credited, and sits inside the zone', async () => {
  const fs = await import('node:fs');
  const credits = JSON.parse(fs.readFileSync(new URL('../public/photos/credits.json', import.meta.url), 'utf8'));
  const credited = new Set(credits.map((c) => c.name));
  for (const z of ZONES)
    for (const p of z.photos || []) {
      assert.ok(fs.existsSync(new URL(`../public/photos/${p.src}.webp`, import.meta.url)), `${z.id}: missing photo ${p.src}`);
      assert.ok(credited.has(p.src), `${p.src} has no credit`);
      assert.ok(p.x > 0 && p.x < SECTION && p.y > 0 && p.y < SECTION, `${p.src} is outside ${z.id}`);
    }
});

test('residents always have something to say', () => {
  for (const z of ZONES)
    for (const r of z.residents)
      for (const ctx of [{ warmth: 0, has: () => false }, { warmth: 1, has: () => true }]) {
        const lines = r.lines(ctx);
        assert.ok(Array.isArray(lines) && lines.length && lines.every((l) => typeof l === 'string' && l), `${z.id}:${r.id}`);
      }
});

test('the outskirts build cleanly, are stable, and never repeat', () => {
  const seen = new Set();
  for (let col = -40; col <= 40; col++)
    for (const row of [-3, -2, -1, 0, 1, 2, 3]) {
      const z = outskirtsZone(col, row), art = z.art();
      clean(art, `outskirts ${col},${row}`);
      clean(z.wash(), `outskirts wash ${col},${row}`);
      assert.ok(!seen.has(art), `outskirts ${col},${row} repeats another section`);
      seen.add(art);
      assert.equal(outskirtsZone(col, row).art(), art, 'the same cell must always draw the same');
      assert.ok(z.residents.every((r) => r.lines().length), 'outskirts residents talk');
    }
});
