import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml } from 'satteri';
import tableLabels from './markdown-table-labels.mjs';

const render = source => markdownToHtml(source, { hastPlugins: [tableLabels] }).html;

test('a short first cell is a label, in the header row and body rows', () => {
  const html = render('| Status | Meaning |\n|---|---|\n| **experimental** | Implemented but not yet covered. |\n| `proposed` | Designed only. |');
  assert.equal(html.match(/class="table-label"/g)?.length, 3);
  assert.ok(html.includes('<td class="table-label"><strong>experimental</strong></td>'));
  assert.ok(!html.includes('<td class="table-label">Implemented'), 'only the first cell');
});

test('a sentence in the first column still wraps', () => {
  const html = render('| Scenario | Answer |\n|---|---|\n| A maintainer approves a plan to update the changelog from the last merged PRs | Yes |');
  assert.ok(!html.includes('<td class="table-label">A maintainer'));
});

test('documents without tables are unchanged', () => {
  const source = '# Title\n\nA paragraph with `code`.\n\n- a list';
  assert.equal(render(source), markdownToHtml(source).html);
});

test('every table can be reached with the keyboard, since it may scroll', () => {
  const html = render('| A | B |\n|---|---|\n| 1 | 2 |');
  assert.match(html, /<table tabindex="0">/);
});
