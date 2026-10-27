// Publish only browser files. Server code and source photos are excluded from the website.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.mkdirSync(output, { recursive: true });
fs.cpSync(path.join(root, 'public'), output, { recursive: true });
fs.writeFileSync(path.join(output, 'js', 'hosting.js'), 'export const GALLERY_ENABLED = false;\n');
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Static site built in dist/');
