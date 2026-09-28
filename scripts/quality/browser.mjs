import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { checkBuilt } from './check-built.mjs';
import { serveBuild } from './server.mjs';

const token = randomUUID();
const dir = resolve('.builds', token);
await mkdir(dir, { recursive:true });
function run(args, env = {}) {
  return new Promise((ok, fail) => {
    const child = spawn(process.execPath, args, { stdio:'inherit', env:{ ...process.env, ASTRO_TELEMETRY_DISABLED:'1', ...env } });
    child.on('error', fail);
    child.on('exit', code => code === 0 ? ok() : fail(new Error(args[0] + ' exited ' + code)));
  });
}
await run(['node_modules/astro/bin/astro.mjs', 'build', '--force', '--outDir', dir], {MAGPIE_CACHE_DIR:resolve('node_modules/.cache', `magpie-quality-${token}`)});
const { pages } = await checkBuilt(process.cwd(), dir);
const manifest = resolve(dir, 'quality-routes.json');
await writeFile(manifest, JSON.stringify({ token, pages }));
const { server, url } = await serveBuild(dir, token);
console.log('Testing a fresh isolated build: ' + url + ' (' + token + ')');
try {
  await run(['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], { MAGPIE_TEST_URL:url, MAGPIE_TEST_MANIFEST:manifest, MAGPIE_TEST_TOKEN:token });
} finally { await new Promise(ok => server.close(ok)); }
