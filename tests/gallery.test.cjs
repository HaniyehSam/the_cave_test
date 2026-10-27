// The gallery wall API: pin, list, refuse fakes, rate-limit, and delete with the right key.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-gallery-'));
process.env.GALLERY_DIR = dir;
const server = require('../server.cjs');

// The smallest valid PNG: one transparent pixel.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==';

async function call(port, method, url, body, headers = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

test('pins go up, show on the wall, and only come down with their key', async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  try {
    const fake = await call(port, 'POST', '/api/gallery', { image: 'data:image/png;base64,bm90IGEgcGljdHVyZQ==', title: 'x' });
    assert.equal(fake.status, 400, 'a non-picture is refused');

    const pin = await call(port, 'POST', '/api/gallery', { image: PNG, title: '<b>My street</b>', author: 'Wren', place: 'Paper Street' });
    assert.equal(pin.status, 201);
    assert.ok(pin.body.id && pin.body.deleteKey);

    const again = await call(port, 'POST', '/api/gallery', { image: PNG, title: 'Too soon' });
    assert.equal(again.status, 429, 'pinning is rate limited');

    const wall = await call(port, 'GET', '/api/gallery');
    assert.equal(wall.body.length, 1);
    assert.equal(wall.body[0].title, 'bMy street/b', 'markup is stripped from titles');
    assert.equal(wall.body[0].keyHash, undefined, 'the key hash is never published');
    const img = await fetch(`http://127.0.0.1:${port}/${wall.body[0].src}`);
    assert.equal(img.headers.get('content-type'), 'image/png');

    assert.equal((await call(port, 'DELETE', `/api/gallery/${pin.body.id}`, null, { 'X-Delete-Key': 'wrong' })).status, 403);
    assert.equal((await call(port, 'DELETE', `/api/gallery/${pin.body.id}`, null, { 'X-Delete-Key': pin.body.deleteKey })).status, 200);
    assert.equal((await call(port, 'GET', '/api/gallery')).body.length, 0);
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
