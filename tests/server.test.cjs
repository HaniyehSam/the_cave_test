// The static server serves the page and nothing outside public/.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const server = require('../server.cjs');

function get(port, path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body }));
    }).on('error', reject);
  });
}

test('serves the world and refuses to leave public/', async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  try {
    const page = await get(port, '/');
    assert.equal(page.status, 200);
    assert.match(page.body, /<canvas id="world"/);
    const js = await get(port, '/js/main.js');
    assert.equal(js.status, 200);
    assert.match(js.type, /javascript/);
    // Nothing from the project root (the server source, its package.json) may leak out.
    for (const sneaky of ['/../server.cjs', '/..%2fserver.cjs', '/..%5cserver.cjs', '/%2e%2e/package.json', '/js/../../server.cjs']) {
      const res = await get(port, sneaky);
      assert.doesNotMatch(res.body, /createServer|"endless-canvas"/, sneaky);
    }
  } finally {
    server.close();
  }
});
