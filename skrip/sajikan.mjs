// Server pratinjau lokal yang meniru GitHub Pages:
//  - situs dipasang di bawah BASE (mis. /cahaya-teratai-putih/)
//  - jalur yang tidak ada dilayani 404.html dengan status 404
//
//   node skrip/sajikan.mjs [port]
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '_site');
const konfig = JSON.parse(await fs.readFile(path.join(AKAR, '..', 'situs.config.json'), 'utf8'));
let BASE = process.env.BASE_PATH ?? new URL(konfig.situs.url).pathname;
if (!BASE.endsWith('/')) BASE += '/';
const PORT = Number(process.argv[2] || process.env.PORT || 8931);

const TIPE = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};

async function coba(p) {
  try {
    const st = await fs.stat(p);
    if (st.isDirectory()) return coba(path.join(p, 'index.html'));
    return p;
  } catch { return null; }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let jalur = decodeURIComponent(url.pathname);
  if (jalur === '/' && BASE !== '/') { res.writeHead(302, { Location: BASE }); return res.end(); }
  if (!jalur.startsWith(BASE)) jalur = BASE + '__tidak_ada__';
  const relatif = jalur.slice(BASE.length);
  // GitHub Pages mengalihkan folder tanpa garis miring akhir
  const target = path.join(AKAR, relatif);
  if (!target.startsWith(AKAR)) { res.writeHead(403); return res.end(); }
  let berkas = await coba(target);
  if (berkas && !jalur.endsWith('/') && (await fs.stat(target).then((s) => s.isDirectory()).catch(() => false))) {
    res.writeHead(301, { Location: jalur + '/' + url.search }); return res.end();
  }
  let status = 200;
  if (!berkas) { berkas = path.join(AKAR, '404.html'); status = 404; }
  const isi = await fs.readFile(berkas);
  res.writeHead(status, { 'Content-Type': TIPE[path.extname(berkas)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(isi);
}).listen(PORT, () => console.log(`Pratinjau: http://localhost:${PORT}${BASE}`));
