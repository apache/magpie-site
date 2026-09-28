import { test, expect } from './fixtures.mjs';
import { mkdir } from 'node:fs/promises';

test('Airflow labels follow their curves and retain a readable phone legend', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const labels = page.locator('.airflow-chart-story .curve-label');
  await expect(labels).toHaveCount(4);
  for (const label of await labels.all()) {
    await expect(label.locator('textPath')).toHaveCount(1);
    const geometry = await label.evaluate(el => {
      const textPath = el.querySelector('textPath');
      const curve = document.querySelector(textPath.getAttribute('href'));
      const length = curve.getTotalLength();
      const charCount = el.getNumberOfChars();
      const angles = Array.from({length:charCount}, (_,i) => el.getRotationOfChar(i));
      const box = el.getBBox();
      return {isCurve:curve.matches('.incoming-line,.manual-history,.without-line,.time-line'),
        length, charCount, content:el.textContent.trim(), angles,
        within:box.x >= 0 && box.y >= 0 && box.x + box.width <= 900 && box.y + box.height <= 390};
    });
    expect(geometry.isCurve).toBe(true);
    expect(geometry.charCount).toBe(geometry.content.length);
    expect(geometry.within).toBe(true);
    expect(geometry.angles.some(angle => Math.abs(angle) > 1)).toBe(true);
  }
  await mkdir('.builds/visual',{recursive:true});
  for (const width of [375,800,1524]) for (const theme of ['light','dark']) {
    await page.setViewportSize({width,height:1100});
    await page.evaluate(theme => localStorage.setItem('magpie-theme',theme),theme);
    await page.reload(); await page.evaluate(() => document.fonts.ready);
    if (width <= 700) {
      await expect(labels.first()).toBeHidden();
      await expect(page.locator('.chart-legend')).toBeVisible();
    } else {
      await expect(labels.first()).toBeVisible();
      await expect(page.locator('.chart-legend')).toBeHidden();
    }
    await page.locator('#airflow').screenshot({path:`.builds/visual/curved-labels-${width}-${theme}.png`,style:'.site-header, .site-header *, .skip-link { visibility:hidden; }'});
  }
});
