// Small server for the endless canvas: static files, plus the gallery wall where visitors
// pin pictures of what they painted. Gallery pins are stored on disk in data/gallery/.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.join(__dirname, 'public');
const galleryDir = process.env.GALLERY_DIR || path.join(__dirname, 'data', 'gallery');
const indexFile = path.join(galleryDir, 'index.json');
const port = Number(process.env.PORT) || 5174;
const MAX_BODY = 6 * 1024 * 1024;   // a base64 picture of up to ~4.5 MB
const MAX_PINS = 1000;
const POST_GAP_MS = 10000;          // one pin per visitor every ten seconds

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
};

function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
  const file = path.join(root, clean || 'index.html');
  return file.startsWith(root) ? file : null;
}

function serveFile(res, file) {
  fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not found');
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  });
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

// ---------- Gallery storage ----------

function readPins() {
  try {
    return JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  } catch {
    return [];
  }
}
function writePins(pins) {
  fs.mkdirSync(galleryDir, { recursive: true });
  const tmp = indexFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(pins, null, 1));
  fs.renameSync(tmp, indexFile);
}

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const tidy = (s, max) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);

// Only real PNG or WebP pictures are accepted.
function pictureType(buf) {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

const lastPost = new Map();

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('That picture is too big.'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function postPin(req, res) {
  const who = req.socket.remoteAddress || '?';
  if (Date.now() - (lastPost.get(who) || 0) < POST_GAP_MS) return json(res, 429, { error: 'Easy! Wait a few seconds before pinning another.' });
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (err) {
    return json(res, err.status || 400, { error: err.status ? err.message : 'That did not look like a picture.' });
  }
  const match = /^data:image\/(png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(body.image || '');
  const buf = match ? Buffer.from(match[2], 'base64') : null;
  const type = buf && pictureType(buf);
  if (!type) return json(res, 400, { error: 'Only PNG or WebP pictures can be pinned.' });
  const pins = readPins();
  if (pins.length >= MAX_PINS) return json(res, 507, { error: 'The wall is full.' });
  const id = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  const deleteKey = crypto.randomBytes(16).toString('hex');
  fs.mkdirSync(galleryDir, { recursive: true });
  fs.writeFileSync(path.join(galleryDir, `${id}.${type}`), buf);
  const pin = {
    id,
    file: `${id}.${type}`,
    title: tidy(body.title, 60) || 'Untitled',
    author: tidy(body.author, 40) || 'Someone',
    place: tidy(body.place, 60),
    created: new Date().toISOString(),
    keyHash: hash(deleteKey),
  };
  pins.unshift(pin);
  writePins(pins);
  lastPost.set(who, Date.now());
  json(res, 201, { id, deleteKey });
}

function deletePin(req, res, id) {
  const pins = readPins();
  const pin = pins.find((p) => p.id === id);
  if (!pin) return json(res, 404, { error: 'No such picture.' });
  if (pin.keyHash !== hash(String(req.headers['x-delete-key'] || ''))) return json(res, 403, { error: 'Only whoever pinned it can take it down.' });
  writePins(pins.filter((p) => p.id !== id));
  fs.rm(path.join(galleryDir, pin.file), () => {});
  json(res, 200, { deleted: id });
}

const publicPin = ({ keyHash, ...pin }) => ({ ...pin, src: `gallery/${pin.file}` });

// ---------- Routes ----------

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
    decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  const p = url.pathname;
  if (p === '/api/gallery' && req.method === 'GET') return json(res, 200, readPins().map(publicPin));
  if (p === '/api/gallery' && req.method === 'POST') return postPin(req, res).catch(() => json(res, 500, { error: 'Something went wrong.' }));
  const del = /^\/api\/gallery\/([a-z0-9-]+)$/.exec(p);
  if (del && req.method === 'DELETE') return deletePin(req, res, del[1]);
  const pic = /^\/gallery\/([a-z0-9-]+\.(png|webp))$/.exec(p);
  if (pic && req.method === 'GET') return serveFile(res, path.join(galleryDir, pic[1]));
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end();
  }
  const file = resolve(p);
  if (!file) {
    res.writeHead(400);
    return res.end();
  }
  serveFile(res, file);
});

if (require.main === module) {
  server.listen(port, '127.0.0.1', () => console.log(`Endless Canvas: http://127.0.0.1:${port}/`));
}
module.exports = server;
