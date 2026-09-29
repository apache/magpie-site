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
          // Inline pieces (a link around code) sit a pixel or two apart on one
          // line; a new line starts only below the previous line's boxes.
          const range = document.createRange(); range.selectNodeContents(cell);
          const boxes = [...range.getClientRects()].filter(r => r.width && r.height).sort((a, b) => a.top - b.top);
          let lines = 0, bottom = -Infinity;
          for (const box of boxes) { if (box.top >= bottom - 1) { lines += 1; bottom = box.bottom; } else bottom = Math.max(bottom, box.bottom); }
          if (lines > 1) out.push('label wraps: ' + cell.textContent.trim());
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
  // The cell is as tall as its row; what matters is that its text is one line.
  expect(await label.evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    const tops = [...range.getClientRects()].filter(r => r.width).map(r => r.top);
    return Math.max(...tops) - Math.min(...tops);
  })).toBeLessThan(4);
});
