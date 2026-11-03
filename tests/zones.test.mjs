// Checks every hand-made zone is well formed, so new zones cannot quietly break the world.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ZONES } from '../public/js/zones/index.js';
import { findInfo, STARTING_FINDS, SECTION, WORLD, PAINTS } from '../public/js/config.js';
import { emptyZone } from '../public/js/zones/empty.js';
import { SHAPES, ANIMS, placeShape } from '../public/js/sketches.js';
import { LINES } from '../public/js/story.js';
import { RECIPES } from '../public/js/mix.js';
import { sectionSVG } from '../public/js/svg.js';
import { readFileSync, existsSync } from 'node:fs';

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
      for (const ctx of [{ warmth: 0, has: () => false, word: () => undefined, parade: false, drawn: 0 }, { warmth: 1, has: () => true, word: () => 'dragon', parade: true, drawn: 40 }]) {
        const lines = r.lines(ctx);
        assert.ok(Array.isArray(lines) && lines.length && lines.every((l) => typeof l === 'string' && l), `${z.id}:${r.id}`);
      }
});

test('every zone sits inside the world, apart from the others', () => {
  for (const z of ZONES) {
    assert.ok(z.col >= WORLD.c0 && z.col <= WORLD.c1 && z.row >= WORLD.r0 && z.row <= WORLD.r1, `${z.id} is outside the world`);
  }
});

test('the empty spaces between zones carry the street and tunnels on, and hold nothing', () => {
  for (let col = WORLD.c0 - 2; col <= WORLD.c1 + 2; col++)
    for (let row = WORLD.r0 - 1; row <= WORLD.r1 + 1; row++) {
      const z = emptyZone(col, row), art = z.art();
      clean(art, `empty ${col},${row}`);
      assert.equal(z.ideas.length + z.residents.length + z.finds.length, 0, `empty ${col},${row} is not empty`);
      const inside = col >= WORLD.c0 && col <= WORLD.c1 && row >= WORLD.r0 && row <= WORLD.r1;
      if (inside && row === 0) assert.match(art, /<path/, `street ${col} has no road`);
      for (const p of z.photos) {
        assert.ok(inside && row === 0, `${col},${row} has a pasted photo off the street`);
        const credits = JSON.parse(readFileSync(new URL('../public/photos/credits.json', import.meta.url), 'utf8'));
        assert.ok(existsSync(new URL(`../public/photos/${p.src}.webp`, import.meta.url)) && credits.some((c) => c.name === p.src), `${p.src} is missing or uncredited`);
        assert.ok(p.y + p.h / 2 <= 720 && p.y - p.h / 2 > 0, `${p.src} does not stand on the pavement`);
      }
      if (!inside || row < 0) assert.equal(art, sectionSVG(''), `${col},${row} should be blank paper`);
    }
});

test('the story has words for the residents it names, and they always talk', () => {
  const residents = new Set(ZONES.flatMap((z) => z.residents.map((r) => `${z.id}:${r.id}`)));
  for (const [key, lines] of Object.entries(LINES)) {
    assert.ok(residents.has(key), `the story writes for ${key}, who is not in town`);
    for (const ctx of [{ has: () => false, word: () => undefined, parade: false, drawn: 0 }, { has: () => true, word: () => 'dragon', parade: false, drawn: 8 }, { has: () => true, word: () => 'dragon', parade: true, drawn: 40 }]) {
      const said = lines(ctx);
      assert.ok(Array.isArray(said) && said.length && said.every((l) => typeof l === 'string' && l), key);
    }
  }
});

test('the mixing dish only knows a few recipes, all from real paints', () => {
  assert.ok(RECIPES.length <= 8);
  for (const r of RECIPES) assert.ok(PAINTS[r.a] && PAINTS[r.b] && /^#[0-9a-f]{6}$/.test(r.hex), r.name);
});

// Every idea must be drawable, inside its section, and use a credited photo if it hides one.
function checkIdeas(z, credited, fs) {
  const ids = new Set();
  for (const idea of z.ideas || []) {
    const where = `${z.id}:${idea.id}`;
    assert.ok(!ids.has(idea.id), `${where} appears twice`);
    ids.add(idea.id);
    assert.ok(['trace', 'space', 'hidden'].includes(idea.type), `${where} has an unknown type`);
    if (idea.anim) assert.ok(ANIMS[idea.anim], `${where} moves in an unknown way`);
    let box;
    if (idea.type === 'trace') {
      assert.ok(SHAPES[idea.shape], `${where} traces an unknown shape ${idea.shape}`);
      const pts = placeShape(idea.shape, idea.x, idea.y, idea.s || 1, idea.flip).flat();
      box = { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])) };
    } else {
      assert.ok(idea.w > 40 && idea.h > 40, `${where} is too small to draw in`);
      box = { x0: idea.x, y0: idea.y, x1: idea.x + idea.w, y1: idea.y + idea.h };
    }
    assert.ok(box.x0 >= 0 && box.y0 >= 0 && box.x1 <= SECTION && box.y1 <= SECTION, `${where} is outside its section`);
    if (idea.type === 'hidden') {
      assert.ok(fs.existsSync(new URL(`../public/photos/${idea.photo}.webp`, import.meta.url)), `${where}: missing photo ${idea.photo}`);
      assert.ok(credited.has(idea.photo), `${idea.photo} has no credit`);
    }
    if (idea.story != null) assert.match(idea.text, /\{a\}|\{w\}/, `${where} has nowhere to put the word`);
  }
}

test('drawing ideas are well formed', async () => {
  const fs = await import('node:fs');
  const credits = JSON.parse(fs.readFileSync(new URL('../public/photos/credits.json', import.meta.url), 'utf8'));
  const credited = new Set(credits.map((c) => c.name));
  for (const z of ZONES) checkIdeas(z, credited, fs);
});

test('the story cave tells its story in order', () => {
  const cave = ZONES.find((z) => z.id === 'storycave');
  const panels = cave.ideas.filter((i) => i.story != null).map((i) => i.story);
  assert.deepEqual(panels, panels.map((_, i) => i));
});
