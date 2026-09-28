import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export async function files(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}

export async function readTree(root, accept = () => true) {
  return new Map(await Promise.all((await files(root)).filter(accept).map(async path => [relative(root, path).replaceAll('\\', '/'), await readFile(path, 'utf8')])));
}

export function fail(errors, label) {
  if (errors.length) { console.error(errors.join('\n')); throw new Error(`${label}: ${errors.length} violation(s)`); }
}
