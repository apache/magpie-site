import { test, expect } from './fixtures.mjs';
import { readFileSync } from 'node:fs';

if (!process.env.MAGPIE_TEST_MANIFEST) throw new Error('Use npm run test:browser so tests own a fresh build and server.');
const manifest = JSON.parse(readFileSync(process.env.MAGPIE_TEST_MANIFEST, 'utf8'));
const docs = manifest.pages.map(p => p.route).filter(route => route.startsWith('/docs/'));

// Short first-column labels keep to one line, and no table cell splits a word
// (the page otherwise allows breaking anywhere). Measured on a phone, where
// columns are narrowest.
test('docs tables never split words, and short row labels stay on one line', async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width:375, height:800 });
  let tables = 0;
  for (const route of docs) {
    await page.goto(route);
    const problems = await page.evaluate(() => {
      const out = [];
      for (const cell of document.querySelectorAll('.docs-prose :is(td,th)')) {
        const style = getComputedStyle(cell);
        if (style.overflowWrap === 'anywhere' || style.wordBreak === 'break-all') out.push('word splitting allowed: ' + cell.textContent.trim().slice(0, 40));
        if (cell.classList.contains('table-label')) {
          const range = document.createRange(); range.selectNodeContents(cell);
          const lines = new Set([...range.getClientRects()].map(r => Math.round(r.top)));
          if (lines.size > 1) out.push('label wraps: ' + cell.textContent.trim());
        }
      }
      return out;
    });
    expect(problems, route).toEqual([]);
    tables += await page.locator('.docs-prose table').count();
  }
  expect(tables).toBeGreaterThan(0);
  // The legend that used to break "experimental" mid-word.
  await page.goto('/docs/modes/');
  const label = page.locator('.docs-prose td.table-label', { hasText:/^experimental$/ }).first();
  await expect(label).toBeVisible();
  expect(await label.evaluate(el => el.getClientRects().length && Math.round(el.getBoundingClientRect().height))).toBeLessThan(60);
});
