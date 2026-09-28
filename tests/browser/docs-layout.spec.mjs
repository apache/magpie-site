import {test, expect} from './fixtures.mjs';
import {measureLayout} from './layout.mjs';
import {measureDesign} from './design.mjs';
import {mkdir} from 'node:fs/promises';

test('documentation shares the site grid, card anatomy and reading rhythm', async ({page}) => {
  await mkdir('.builds/visual',{recursive:true});
  for (const width of [320,375,801,1151,1440,2076]) for (const theme of ['light','dark']) {
    await page.setViewportSize({width,height:1100});
    await page.goto('/docs');
    await page.evaluate(theme => localStorage.setItem('magpie-theme',theme),theme);
    await page.reload(); await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(measureLayout)).toEqual([]);
    expect(await page.evaluate(measureDesign)).toEqual([]);
    await expect(page.locator('.docs-card-grid .workflow-card-heading > .card-badge > svg')).toHaveCount(4);
    const gap = await page.locator('.docs-overview-section').first().evaluate(el => parseFloat(getComputedStyle(el).marginTop));
    expect(gap).toBe(width <= 800 ? 32 : 64);
    await page.screenshot({path:`.builds/visual/docs-overview-${width}-${theme}.png`});
    if (width === 375) {
      await page.getByRole('button',{name:'Browse documentation',exact:true}).click();
      await expect(page.locator('#docs-sidebar')).toBeVisible();
      expect(await page.evaluate(measureLayout)).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button',{name:'Browse documentation',exact:true})).toBeFocused();
    }
  }
  await page.goto('/docs/setup/secure-agent-setup');
  expect(await page.evaluate(measureLayout)).toEqual([]);
});

test('heading links reveal their icon on hover and keyboard focus without moving text', async ({page}) => {
  await page.goto('/#agent-isolation');
  const link=page.locator('#setup-utilities-title a'), icon=link.locator('svg');
  await page.mouse.move(0,0);
  await expect(icon).toHaveCSS('opacity','0');
  const before=await link.boundingBox();
  const alignment = await link.evaluate(el => {
    const title=el.querySelector('span').getBoundingClientRect(), owner=el.parentElement.getBoundingClientRect();
    return Math.abs((title.left+title.right-owner.left-owner.right)/2);
  });
  expect(alignment,'The icon must not reserve space in the centered title').toBeLessThan(1);
  await link.hover(); await expect(icon).toHaveCSS('opacity','1');
  expect(await link.boundingBox()).toEqual(before);
  await page.mouse.move(0,0); await link.focus();
  await expect(icon).toHaveCSS('opacity','1');
});

test.describe('touch heading links', () => {
  test.use({hasTouch:true,isMobile:true,viewport:{width:375,height:900}});
  test('permalinks remain discoverable without hover', async ({page}) => {
    await page.goto('/#agent-isolation');
    await expect(page.locator('#setup-utilities-title a svg')).toHaveCSS('opacity','1');
  });
});
