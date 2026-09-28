import { readFile, rm } from 'node:fs/promises';
import { relative } from 'node:path';
import { files } from './files.mjs';

// The upstream asset folder also contains source transcripts and illustrations
// for hidden docs. Keep its local sync cache intact; publish only referenced
// generated assets, following references inside SVG/CSS assets transitively.
export function referencedDocAssets(tree) {
  const candidates = [...tree.keys()].filter(p => p.startsWith('docs-assets/'));
  const reached = new Set();
  const queue = [...tree].filter(([p]) => !p.startsWith('docs-assets/'));
  while (queue.length) {
    const [from, text] = queue.shift();
    for (const name of candidates) {
      if (reached.has(name)) continue;
      const relativePath = relative(from.substring(0,from.lastIndexOf('/')) || '.',name).replaceAll('\\','/');
      if (text.includes('/'+name) || (from.startsWith('docs-assets/') && [relativePath,'./'+relativePath].some(path => text.includes('"'+path+'"') || text.includes("'"+path+"'")))) {
        reached.add(name); queue.push([name,tree.get(name)]);
      }
    }
  }
  return reached;
}

export default function publishDocAssets() {
  return { name:'magpie-referenced-doc-assets', hooks:{
    'astro:build:done':async ({dir}) => {
      const tree = new Map();
      for (const path of await files(dir.pathname)) {
        const name = path.slice(dir.pathname.length);
        tree.set(name,/\.(?:html|css|js|json|md|svg|txt)$/.test(name) ? await readFile(path,'utf8') : '');
      }
      const reached = referencedDocAssets(tree);
      const unused = [...tree.keys()].filter(p => p.startsWith('docs-assets/') && !reached.has(p));
      for (const name of unused) await rm(new URL(name,dir));
      console.log(`Generated documentation assets: ${reached.size} published, ${unused.length} source-only assets omitted.`);
    },
  }};
}
