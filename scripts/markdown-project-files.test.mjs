import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml } from 'satteri';
import projectFiles from './markdown-project-files.mjs';

test('project configuration placeholders render as text while real links remain links', () => {
  const source = '[project rules](/docs/security/%3Cproject-config%3E/project) and [setup](/docs/setup/readme)';
  const { html } = markdownToHtml(source, { hastPlugins: [projectFiles] });
  assert.match(html, /<span class="project-file-reference"[^>]*>project rules<\/span>/);
  assert.ok(html.includes('<a href="/docs/setup/readme">setup</a>'));
  assert.ok(!html.includes('href="/docs/security/'));
});

test('project configuration placeholders render as text when linked to the framework source', () => {
  const source = '[dir](https://github.com/apache/magpie/tree/main/docs/security/<project-config>/) and [file](https://github.com/apache/magpie/blob/main/<project-config>/project.md#cve-authority) and [real](https://github.com/apache/magpie/blob/main/README.md)';
  const { html } = markdownToHtml(source, { hastPlugins: [projectFiles] });
  assert.match(html, /<span class="project-file-reference"[^>]*>dir<\/span>/);
  assert.match(html, /<span class="project-file-reference"[^>]*>file<\/span>/);
  assert.ok(html.includes('<a href="https://github.com/apache/magpie/blob/main/README.md">real</a>'));
});
