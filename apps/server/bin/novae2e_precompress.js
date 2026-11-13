/*
 * NovaE2E: writes a Brotli (.br, quality 11) and a gzip (.gz, level 9) copy next to every static file
 * that is worth compressing. The server then sends these copies instead of compressing on every request.
 * Run after the server assets have been copied to apps/server/dist/static.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..', 'dist');
const dirs = ['static', 'libs'].map(dir => path.join(root, dir)).filter(dir => fs.existsSync(dir));
const extensions = new Set(['.js', '.mjs', '.css', '.wasm', '.json', '.svg', '.html', '.ttf', '.txt', '.webmanifest']);
const minBytes = 1024;

const walk = dir =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

let files = 0;
let rawBytes = 0;
let brBytes = 0;
let gzBytes = 0;

for (const file of dirs.flatMap(walk)) {
  if (!extensions.has(path.extname(file)) || fs.statSync(file).size < minBytes) {
    continue;
  }
  const raw = fs.readFileSync(file);
  const br = zlib.brotliCompressSync(raw, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
    },
  });
  const gz = zlib.gzipSync(raw, {level: 9});
  // Keep a copy only when it really saves something.
  if (br.length < raw.length * 0.95) {
    fs.writeFileSync(`${file}.br`, br);
    brBytes += br.length;
  }
  if (gz.length < raw.length * 0.95) {
    fs.writeFileSync(`${file}.gz`, gz);
    gzBytes += gz.length;
  }
  files++;
  rawBytes += raw.length;
}

const mb = bytes => (bytes / 1e6).toFixed(2);
console.log(`precompress: ${files} files, raw ${mb(rawBytes)} MB, br ${mb(brBytes)} MB, gz ${mb(gzBytes)} MB`);
