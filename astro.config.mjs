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

// Back-compat redirects from the pre-rename routes (/skills → /docs, the whole
// Documentation site). Emitted as static meta-refresh HTML pages so they work on
// ASF's static host. The dynamic `/skills/[...slug]` mapping reuses the
// /docs/[...slug] route's getStaticPaths, so every old doc URL — including the
// per-tool pages that were at /skills/tools/<name> — redirects to its /docs
// equivalent.
//
// Note: /tools is now a real page (the tools browser, src/pages/tools.astro), so
// it is no longer redirected to /architecture.
const redirects = {
  "/skills": "/docs",
  "/skills/[...slug]": "/docs/[...slug]",
};

// https://astro.build/config
export default defineConfig({
  site,
  base,
  redirects,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
