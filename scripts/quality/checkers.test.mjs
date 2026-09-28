import test from 'node:test';
import assert from 'node:assert/strict';
import { auditBuild } from './check-built.mjs';
import { auditStyles, sourceTokens } from './check-styles.mjs';

test('Lucide runtime class requires its component import, without a prefix exemption', () => {
  const css = new Map([['icons.css','svg.lucide { stroke-width:1.75; }']]);
  assert.match(auditStyles(css,sourceTokens(new Map())).join('\n'),/orphan class/);
  const tokens = sourceTokens(new Map([['icon.tsx','import { Check } from "lucide-react"; const icon = <Check />;']]));
  assert.deepEqual(auditStyles(css,tokens),[]);
  assert.match(auditStyles(new Map([['icons.css','.lucide-unused { color:red; }']]),tokens).join('\n'),/orphan class/);
});
import { hoistIslandStyle } from './hoist-island-style.mjs';
import { serveBuild } from './server.mjs';
import { mkdtemp, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { markdownToHtml } from 'satteri';
import { markdownSemantics, taskLabels } from '../markdown-semantics.mjs';
import { spawnSync } from 'node:child_process';
import { referencedDocAssets } from './prune-doc-assets.mjs';

const page = body => '<!doctype html><html lang="en"><head><title>Fixture</title></head><body><a href="#main-content">Skip</a><main id="main-content"><h1>Fixture</h1>' + body + '</main></body></html>';
const tree = body => new Map([['index.html', page(body)]]);
test('generated asset publishing follows SVG references and excludes unused source transcripts', () => {
  const input = new Map([
    ['index.html','<img src="/docs-assets/diagram.svg">'],
    ['docs-assets/diagram.svg','<image href="./bird.png"/>'],
    ['docs-assets/bird.png',''], ['docs-assets/unused.txt','Source transcript'],
  ]);
  assert.deepEqual([...referencedDocAssets(input)].sort(),['docs-assets/bird.png','docs-assets/diagram.svg']);
});
test('build checker accepts a linked page, resource, fragment and redirect', async () => {
  const input = tree('<a href="/guide#section">Guide</a><img src="/bird.svg" alt="Bird"><a href="/legacy">Old URL</a>');
  input.set('guide/index.html', page('<h2 id="section">Section</h2>'));
  input.set('legacy/index.html', '<!doctype html><html lang="en"><head><title>Moved</title><meta http-equiv="refresh" content="0;url=/guide"></head><body></body></html>');
  input.set('bird.svg','<svg/>');
  assert.deepEqual((await auditBuild(input, ['bird.svg'])).errors, []);
});
for (const [name, body, pattern] of [
  ['broken link','<a href="/gone">Gone</a>', /missing target/],
  ['broken fragment','<a href="#gone">Gone</a>', /missing fragment/],
  ['missing image','<img src="/gone.png" alt="Gone">', /missing target/],
  ['duplicate ID','<p id="same">One</p><p id="same">Two</p>', /no-dup-id/],
  ['invalid nesting','<ul><div>Invalid</div></ul>', /element-permitted-content/],
  ['missing ARIA target','<button aria-controls="missing">Expand</button>', /aria-controls/],
  ['unlabelled control','<input type="text">', /input-missing-label/],
  ['unclosed HTML','<aside>Open', /close-order/],
]) test('build checker rejects ' + name, async () => {
  assert.match((await auditBuild(tree(body))).errors.join('\n'), pattern);
});
test('route checker rejects a disconnected cycle, even with mutual inbound links', async () => {
  const input = tree('');
  input.set('a/index.html', page('<a href="/b">B</a>'));
  input.set('b/index.html', page('<a href="/a">A</a>'));
  assert.equal((await auditBuild(input)).errors.filter(e => e.includes('no navigation path')).length, 2);
});
test('asset checker rejects an unreferenced resource', async () => {
  const input = tree(''); input.set('unused.svg','<svg/>');
  assert.match((await auditBuild(input, ['unused.svg'])).errors.join('\n'), /orphan asset/);
});
test('asset checker reads inactive CSS theme URLs and runtime JS imports', async () => {
  const input = tree('<script src="/client.js"></script><link rel="stylesheet" href="/theme.css">');
  input.set('client.js', 'fetch("/data.json")');
  input.set('theme.css', 'html[data-theme=dark] { background:url("/night.svg"); }');
  input.set('data.json', '{}'); input.set('night.svg','<svg/>');
  assert.deepEqual((await auditBuild(input, ['night.svg','data.json'])).errors, []);
});
test('code snippets and attribute suffixes are not asset URLs', async () => {
  const input = tree('<pre>" /path/to/file.json "</pre><link rel="stylesheet" href="/theme.css">');
  input.set('theme.css','img[src$="/suffix.svg"] { color:red; }');
  assert.deepEqual((await auditBuild(input)).errors, []);
});
test('CSS checker rejects dead classes and repeated declarations across files', () => {
  assert.match(auditStyles(new Map([['a.css','.unused { color:red; }']]), new Set()).join('\n'), /orphan class/);
  assert.match(auditStyles(new Map([['a.css','.card { color:red; }'],['b.css','.card { color:blue; }']]), new Set(['card'])).join('\n'), /duplicate color/);
  assert.match(auditStyles(new Map([['a.css','.card { color:red; color:blue; }']]), new Set(['card'])).join('\n'), /duplicate color/);
  assert.match(auditStyles(new Map([['a.css','#abandoned { color:red; }']]), new Set()).join('\n'), /orphan id/);
  assert.match(auditStyles(new Map([['a.css','@keyframes abandoned { to {opacity:0} }']]), new Set()).join('\n'), /orphan animation/);
});
test('CSS checker distinguishes media variants and scoped components', () => {
  assert.deepEqual(auditStyles(new Map([['a.css','.card { color:red; } @media(max-width:800px){.card{color:blue;}}']]),new Set(['card'])), []);
  assert.deepEqual(auditStyles(new Map([['a.astro#style0','.card { color:red; }'],['b.astro#style0','.card { color:blue; }']]),new Set(['card'])), []);
});
test('source inventory includes conditional class strings and finite runtime names', () => {
  const tokens = sourceTokens(new Map([['card.tsx','const cls = active ? "selected-card" : "idle-card";']]));
  assert.ok(tokens.has('selected-card')); assert.ok(tokens.has('idle-card')); assert.ok(tokens.has('t-result'));
  assert.ok(!tokens.has('t-abandoned'));
});
test('only the exact Astro island reset is hoisted; other invalid styles remain detectable', async () => {
  const reset = '<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>';
  const html = hoistIslandStyle(page(reset));
  assert.ok(html.indexOf(reset) < html.indexOf('</head>'));
  assert.deepEqual((await auditBuild(new Map([['index.html',html]]))).errors, []);
  assert.match((await auditBuild(tree('<style>.bad{color:red}</style>'))).errors.join('\n'), /element-permitted-content/);
});
test('markdown transform preserves examples, labels tasks and gives one document title', () => {
  const result = markdownToHtml('# Title\n\n# Embedded template\n\nHello <name>\n\n- [ ] Review the code\n', { mdastPlugins:[markdownSemantics], hastPlugins:[taskLabels] });
  assert.match(result.html, /<h1>Title/);
  assert.match(result.html, /<h2>Embedded template/);
  assert.match(result.html, /&lt;name&gt;/);
  assert.match(result.html, /<label><input/);
  assert.match(result.html, /Review the code<\/label>/);
});
test('only the known upstream unmatched authoring wrapper is removed', () => {
  const known = markdownToHtml('# SVN source-release runbook (signed archive)\n\nText\n</content>', { mdastPlugins:[markdownSemantics] });
  assert.ok(!known.html.includes('</content>'));
  const unknown = markdownToHtml('# Another document\n\n</content>', { mdastPlugins:[markdownSemantics] });
  assert.ok(unknown.html.includes('</content>'));
});
test('Knip rejects an unused file, export and dependency; accepts a dynamic import', async () => {
  const dir = await realpath(await mkdtemp(join(tmpdir(),'magpie-knip-')));
  const cli = join(process.cwd(),'node_modules/knip/bin/knip.js');
  const run = () => spawnSync(process.execPath,[cli,'--directory',dir,'--no-progress'], { encoding:'utf8' });
  try {
    await writeFile(join(dir,'package.json'),JSON.stringify({ name:'fixture', type:'module' }));
    await writeFile(join(dir,'knip.json'),JSON.stringify({ entry:['index.js'],project:['*.js'] }));
    await writeFile(join(dir,'tsconfig.json'),JSON.stringify({ compilerOptions:{ allowJs:true,module:'ESNext',moduleResolution:'Bundler' } }));
    await writeFile(join(dir,'index.js'),'const {used} = await import("./lib.js"); console.log(used);');
    await writeFile(join(dir,'lib.js'),'export const used = 1;');
    let result = run(); assert.equal(result.status,0,result.stdout+result.stderr);
    await writeFile(join(dir,'lib.js'),'export const used = 1; export const abandoned = 2;');
    await writeFile(join(dir,'orphan.js'),'export const orphan = true;');
    await writeFile(join(dir,'package.json'),JSON.stringify({ name:'fixture', type:'module', dependencies:{'never-used-package':'1.0.0'} }));
    result = run(); assert.notEqual(result.status,0);
    for (const name of ['abandoned','orphan.js','never-used-package']) assert.ok(result.stdout.includes(name),result.stdout+result.stderr);
  } finally { await rm(dir,{ recursive:true, force:true }); }
});
test('server owns a random port, identifies its build, serves real 404s and blocks traversal', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'magpie-server-'));
  await writeFile(join(dir,'index.html'), 'current build');
  await writeFile(join(dir,'404.html'), 'not found');
  const { server, url } = await serveBuild(dir,'fixture-token');
  try {
    const response = await fetch(url);
    assert.equal(response.headers.get('x-magpie-build'),'fixture-token');
    assert.equal(await response.text(),'current build');
    assert.equal((await fetch(url + '/missing')).status,404);
    assert.equal((await fetch(url + '/..%2f..%2fsecret')).status,403);
  } finally { await new Promise(ok => server.close(ok)); await rm(dir,{ recursive:true }); }
});
