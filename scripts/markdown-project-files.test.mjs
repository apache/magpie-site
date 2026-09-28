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
