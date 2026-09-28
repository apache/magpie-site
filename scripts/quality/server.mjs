import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.woff2':'font/woff2', '.txt':'text/plain', '.md':'text/plain' };

export async function serveBuild(dir, token) {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    res.setHeader('X-Magpie-Build', token);
    res.setHeader('Cache-Control', 'no-store');
    try {
      const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
      let file;
      for (const candidate of [path, resolve(path, 'index.html'), path + '.html']) if (await stat(candidate).then(s => s.isFile()).catch(() => false)) { file = candidate; break; }
      if (!file) { res.writeHead(404, { 'Content-Type':'text/html' }); res.end(await readFile(resolve(root, '404.html'))); return; }
      res.writeHead(200, { 'Content-Type':mime[extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(file));
    } catch { res.writeHead(500); res.end('Build server error'); }
  });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
  return { server, url:'http://127.0.0.1:' + server.address().port };
}
