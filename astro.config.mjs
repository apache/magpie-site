// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Production is served directly at the apex https://magpie.apache.org/ (root path).
// Override SITE_URL / SITE_BASE if you ever need to preview under a subpath.
const site = process.env.SITE_URL ?? 'https://magpie.apache.org';
const base = process.env.SITE_BASE ?? '/';

// Internal `.md` links in the synced docs are rewritten to site routes by
// scripts/rewrite-doc-links.mjs (run from scripts/sync-docs.sh at build time).

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
