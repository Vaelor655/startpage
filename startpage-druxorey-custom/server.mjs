import http from 'node:http';
import os from 'node:os';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 8080);
const mime = { '.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon' };

function privateHostIps() {
  const result = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const item of entries || []) {
      if (item.family !== 'IPv4' || item.internal) continue;
      if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address)) result.push(item.address);
    }
  }
  return [...new Set(result)];
}

function clientInfo(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) || '';
  const remote = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  if (forwardedIp) return { ip: forwardedIp.replace(/^::ffff:/, ''), source: 'forwarded' };
  if (remote && remote !== '127.0.0.1' && remote !== '::1') return { ip: remote, source: 'client' };
  const candidates = privateHostIps();
  return { ip: candidates[0] || remote || 'inconnue', source: candidates.length ? 'host-fallback' : 'loopback', candidates };
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/client-ip') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(clientInfo(req)));
    return;
  }
  const rawPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let relative = rawPath === '/' ? '/index.html' : rawPath;
  relative = normalize(relative).replace(/^(\.\.[/\\])+/, '');
  let path = join(root, relative);
  if (!path.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (!existsSync(path) || statSync(path).isDirectory()) path = join(root, 'index.html');
  if (!existsSync(path)) { res.writeHead(404); res.end('Build missing. Run npm run build first.'); return; }
  res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': extname(path) === '.html' ? 'no-cache' : 'public, max-age=3600' });
  createReadStream(path).pipe(res);
});
server.listen(port, host, () => console.log(`Startpage: http://${host}:${port}`));
