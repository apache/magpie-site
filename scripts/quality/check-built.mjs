import { load } from 'cheerio';
import { HtmlValidate } from 'html-validate';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { files, readTree, fail } from './files.mjs';

const origin = 'https://magpie.apache.org';
export function routeOf(file) {
  return file === 'index.html' ? '/' : `/${file.replace(/\/index\.html$/, '/').replace(/\.html$/, '')}`;
}
export function resolveTarget(value, route, names) {
  if (!value || /^(?:mailto:|tel:|data:|blob:)/i.test(value)) return null;
  const url = new URL(value, `${origin}${route}`);
  if (url.origin !== origin) return null;
  const path = decodeURIComponent(url.pathname).replace(/^\//, '');
  const file = [path, `${path.replace(/\/$/, '')}/index.html`, `${path.replace(/\/$/, '')}.html`].find(p => names.has(p)) ?? (path === '' && names.has('index.html') ? 'index.html' : null);
  return { file, hash: decodeURIComponent(url.hash.slice(1)), url: url.pathname };
}

// Validate raw HTML, before the browser silently repairs invalid nesting.
const validator = new HtmlValidate({ elements: ['html5'], rules: {
  'close-order': 'error', 'element-permitted-content': 'error',
  'element-permitted-parent': 'error', 'element-permitted-occurrences': 'error',
  'no-dup-id': 'error', 'no-dup-attr': 'error', 'wcag/h32': 'error',
  'input-missing-label': 'error', 'wcag/h37': 'error'
} });

export async function auditBuild(tree, publicNames = []) {
  const errors = [], names = new Set(tree.keys()), pages = new Map(), edges = new Map(), referenced = new Set();
  for (const [file, html] of tree) {
    if (!file.endsWith('.html')) continue;
    const $ = load(html), route = routeOf(file), redirect = $('meta[http-equiv="refresh" i]').attr('content');
    pages.set(file, { $, route, redirect }); edges.set(file, new Set());
    if ($('body style').length) errors.push(`${file}: element-permitted-content: styles must be in head`);
    const report = await validator.validateString(html, file);
    for (const result of report.results) for (const message of result.messages) errors.push(`${file}:${message.line}: ${message.ruleId}: ${message.message}`);
    if (!redirect) {
      for (const [selector, count] of [['html[lang]', 1], ['head > title', 1], ['main', 1], ['h1', 1]]) {
        if ($(selector).length !== count) errors.push(`${file}: expected ${count} ${selector}, got ${$(selector).length}`);
      }
      if (!$('head > title').text().trim()) errors.push(`${file}: empty title`);
      if (!$('a[href="#main-content"]').length || !$('#main-content').length) errors.push(`${file}: missing skip link or its destination`);
    }
  }
  function reference(value, from, isLink = false, fragment = true) {
    let target;
    try { target = resolveTarget(value, pages.get(from)?.route ?? `/${from}`, names); }
    catch { errors.push(`${from}: malformed URL ${value}`); return; }
    if (!target) return;
    if (!target.file) { errors.push(`${from}: missing target ${value}`); return; }
    referenced.add(target.file);
    if (isLink && pages.has(target.file)) edges.get(from)?.add(target.file);
    if (fragment && target.hash && pages.has(target.file) && !pages.get(target.file).$('[id]').toArray().some(node => node.attribs.id === target.hash)) errors.push(`${from}: missing fragment ${value}`);
  }
  for (const [file, { $, redirect }] of pages) {
    $('a[href],area[href]').each((_, node) => reference($(node).attr('href'), file, true));
    $('[src],link[href],image[href],use[href],video[poster],[data-index],[data-markdown]').each((_, node) => {
      for (const attr of ['src', 'href', 'poster', 'data-index', 'data-markdown']) if ($(node).attr(attr)) reference($(node).attr(attr), file, false, attr !== 'src');
    });
    $('[srcset]').each((_, node) => { for (const candidate of $(node).attr('srcset').split(',')) reference(candidate.trim().split(/\s+/)[0], file); });
    $('meta[property="og:image"],meta[name="twitter:image"]').each((_, node) => reference($(node).attr('content'), file));
    $('[aria-controls],[aria-labelledby],[aria-describedby],label[for]').each((_, node) => {
      for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby', 'for']) for (const id of ($(node).attr(attr) ?? '').split(/\s+/).filter(Boolean)) if (!$('[id]').toArray().some(n => n.attribs.id === id)) errors.push(`${file}: ${attr} references missing #${id}`);
    });
    if (redirect) reference(redirect.replace(/^.*?url=/i, ''), file, true);
  }
  // Runtime assets in JS and CSS (including inactive themes and lazy imports).
  for (const [file, text] of tree) {
    if (/\.(?:css|js|html|json|md|svg)$/.test(file)) {
      if (file.endsWith('.svg')) load(text, {xml:true})('[href],[xlink\\:href]').each((_, node) => reference(node.attribs.href ?? node.attribs['xlink:href'],file,false,false));
      const runtime = file.endsWith('.html') ? load(text)('script').text() : file.endsWith('.js') ? text : '';
      for (const match of runtime.matchAll(/["'`]((?:\/(?!\/)|\.\.?\/)[^\s"'`()<>]+\.(?:png|svg|jpg|jpeg|webp|ico|woff2?|json|js|css))["'`]/g)) reference(match[1], file, false, false);
      if (file.endsWith('.css')) for (const match of text.matchAll(/url\(\s*["']?([^\s"'()]+)["']?\s*\)/g)) reference(match[1], file, false, false);
      // The build may emit public assets inside encoded Astro island props.
      for (const name of publicNames) if (text.includes(`/${name}`)) referenced.add(name);
    }
  }
  const reached = new Set(), queue = ['index.html'];
  while (queue.length) { const file = queue.shift(); if (reached.has(file)) continue; reached.add(file); queue.push(...(edges.get(file) ?? [])); }
  for (const [file, page] of pages) if (!page.redirect && file !== '404.html' && !reached.has(file)) errors.push(`${file}: public page has no navigation path from /`);
  for (const name of publicNames) if (!referenced.has(name)) errors.push(`public/${name}: orphan asset (no build or runtime reference)`);
  return { errors: [...new Set(errors)], pages: [...pages].filter(([, p]) => !p.redirect).map(([file, p]) => ({ file, route: p.route })) };
}

export async function checkBuilt(root = process.cwd(), buildDir = resolve(root, 'dist')) {
  const tree = await readTree(buildDir, p => /\.(html|css|js|json|txt|md|svg)$/.test(p));
  // Binary resources participate in target resolution without being decoded.
  for (const path of await files(buildDir)) { const name = path.slice(buildDir.length + 1); if (!tree.has(name)) tree.set(name, ''); }
  // Host configuration and asset provenance are not UI assets. Upstream asset
  // source files remain in the sync cache; every published one is audited.
  const publicNames = (await files(resolve(root, 'public'))).map(p => p.slice(resolve(root, 'public').length + 1)).filter(p => !p.startsWith('docs-assets/') && !/(?:^|\/)(?:README|SOURCES)\.md$/.test(p) && !['_headers', '.htaccess', 'robots.txt'].includes(p));
  publicNames.push(...[...tree.keys()].filter(p => p.startsWith('docs-assets/')));
  const result = await auditBuild(tree, publicNames);
  fail(result.errors, 'Build integrity');
  console.log(`Build integrity: ${result.pages.length} HTML pages; links, fragments, structure, reachability and ${publicNames.length} assets passed.`);
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await checkBuilt();
