import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml } from 'satteri';
import callouts from './markdown-callouts.mjs';

test('callouts preserve links, emphasis, code and lists from documentation', () => {
  for (const kind of ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']) {
    const { html } = markdownToHtml(`> [!${kind}]\n> Read **this** [guide](/docs) and run \`verify\`.\n>\n> - Keep this item.`, { hastPlugins: [callouts] });
    assert.match(html, new RegExp(`class="doc-callout doc-callout-${kind.toLowerCase()}" role="note"`));
    assert.ok(html.includes('<strong>this</strong> <a href="/docs">guide</a>'));
    assert.ok(html.includes('<code>verify</code>'));
    assert.ok(html.includes('<li>Keep this item.</li>'));
    assert.ok(!html.includes(`[!${kind}]`));
  }
});

test('ordinary quotes and literal examples remain unchanged', () => {
  const source = '> An ordinary quote.\n\n> [!UNKNOWN]\n> Keep this text.\n\n```md\n> [!NOTE]\n> An example.\n```';
  assert.equal(markdownToHtml(source, { hastPlugins: [callouts] }).html, markdownToHtml(source).html);
});
