import { readFile, writeFile } from 'node:fs/promises';
import { files } from './files.mjs';

// Astro emits this hydration reset beside the first island, in body content.
// Hoist only the known reset; arbitrary misplaced styles still fail validation.
export function hoistIslandStyle(html) {
  const reset = '<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>';
  if (!html.includes(reset)) return html;
  return html.replaceAll(reset, '').replace('</head>', reset + '</head>');
}
export default function islandStyle() {
  return { name:'magpie-valid-island-style', hooks: {
    'astro:build:done': async ({ dir }) => {
      for (const file of await files(dir.pathname)) if (file.endsWith('.html')) {
        const html = await readFile(file, 'utf8'), next = hoistIslandStyle(html);
        if (next !== html) await writeFile(file, next);
      }
    },
  } };
}
