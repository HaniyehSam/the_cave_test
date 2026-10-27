// Developer tool: serves the photo cutout page and saves its results into public/photos/.
// Run: node tools/cutout-server.cjs, then open http://127.0.0.1:5175/
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const project = path.join(__dirname, '..');
const raw = path.join(project, 'assets-src', 'photos', 'raw');
const settings = path.join(project, 'assets-src', 'photos', 'cutouts.json');
const out = path.join(project, 'public', 'photos');
const port = Number(process.env.PORT) || 5175;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function send(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const safeName = (s) => /^[a-z0-9-]+\.(jpg|png|webp)$/.test(s) ? s : null;

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/') return send(res, path.join(__dirname, 'cutout.html'));
  if (req.method === 'GET' && url.pathname === '/settings.json') return send(res, settings);
  if (req.method === 'GET' && url.pathname.startsWith('/raw/')) {
    const name = safeName(url.pathname.slice(5));
    return name ? send(res, path.join(raw, name)) : (res.writeHead(400), res.end());
  }
  if (req.method === 'GET' && url.pathname.startsWith('/photos/')) {
    const name = safeName(url.pathname.slice(8));
    return name ? send(res, path.join(out, name)) : (res.writeHead(400), res.end());
  }
  if (req.method === 'POST' && url.pathname === '/review') {
    // A contact sheet of every result, for checking cutouts without a browser.
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      fs.writeFileSync(path.join(project, 'assets-src', 'photos', 'review.png'), Buffer.concat(chunks));
      res.writeHead(200);
      res.end('ok');
    });
    return;
  }
  if (req.method === 'POST' && url.pathname.startsWith('/save/')) {
    const name = safeName(url.pathname.slice(6));
    if (!name || !name.endsWith('.webp')) {
      res.writeHead(400);
      return res.end();
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, name), Buffer.concat(chunks));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ saved: name, bytes: Buffer.concat(chunks).length }));
    });
    return;
  }
  res.writeHead(404);
  res.end();
}).listen(port, '127.0.0.1', () => console.log(`Cutout tool: http://127.0.0.1:${port}/`));
