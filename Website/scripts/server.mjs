import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const root = args.includes('--dist') ? resolve(project, 'dist') : project;
const portArg = args.indexOf('--port');
const port = Number(portArg >= 0 ? args[portArg + 1] : process.env.PORT || 5173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

const server = http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    // Serve application assets only; do not expose workspace files or secrets.
    const providerAsset = /^\/providers\/[a-z0-9-]+\.(png|svg)$/.test(pathname);
    const allowed = pathname === '/' || pathname === '/index.html' || pathname === '/favicon.svg' || /^\/src\/[\w-]+\.(js|css)$/.test(pathname) || providerAsset;
    if (!allowed) { response.writeHead(404).end('Not found'); return; }
    const publicAsset = pathname === '/favicon.svg' || providerAsset;
    const relative = pathname === '/' ? 'index.html' : publicAsset && root === project ? 'public' + pathname : pathname.slice(1);
    const file = resolve(root, relative);
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) { response.writeHead(403).end('Forbidden'); return; }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(404).end('Not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '0.0.0.0', () => console.log(`ModelWing API is running at http://localhost:${port}${args.includes('--dist') ? ' (production build)' : ''}`));
