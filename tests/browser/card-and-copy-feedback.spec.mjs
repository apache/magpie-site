import {test, expect} from './fixtures.mjs';
import {mkdir} from 'node:fs/promises';
import {measureLayout} from './layout.mjs';

test('whole-card links highlight the destination without underlining descriptions', async ({page}) => {
  await page.goto('/docs');
  const card=page.locator('.docs-card').first(), title=card.locator('.workflow-card-title');
  await expect(page.locator('.docs-card .workflow-card-title > .card-link-arrow')).toHaveCount(4);
  expect(await page.evaluate(measureLayout)).toEqual([]);
  const titleColor=await title.evaluate(el => getComputedStyle(el).color);
  await card.hover();
  await expect(card).toHaveCSS('text-decoration-line','none');
  await expect(card.locator('p')).toHaveCSS('text-decoration-line','none');
  await expect(title).toHaveCSS('color',titleColor);
  await page.mouse.move(0,0); await card.focus();
  await expect(card).toHaveCSS('outline-style','solid');
  await expect(card).toHaveCSS('outline-width','2px');
  const arrow=card.locator('.card-link-arrow');
  await arrow.evaluate(el=>el.closest('a').append(el));
  expect(await page.evaluate(measureLayout)).toContain('card entry arrow is detached from its title');
  await arrow.evaluate(el=>el.closest('a').querySelector('.workflow-card-title').append(el));
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/docs\/security\/readme\/?$/);
});

test('copy blocks share a compact layout and copy only their text', async ({page,context}) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await mkdir('.builds/visual',{recursive:true});
  for (const width of [375,1440]) for (const theme of ['light','dark']) {
    await page.setViewportSize({width,height:1100});
    await page.goto('/start');
    await page.evaluate(theme => localStorage.setItem('magpie-theme',theme),theme); await page.reload();
    const blocks=page.locator('.install-code,.start-request');
    const styles=await blocks.evaluateAll(nodes => nodes.map(el => {
      const s=getComputedStyle(el); return [s.backgroundColor,s.borderRadius,s.padding];
    }));
    expect(styles[1]).toEqual(styles[0]); expect(styles[2]).toEqual(styles[0]);
    for (const block of await blocks.all()) {
      const content=block.locator('pre,p'), button=block.getByRole('button');
      const a=await content.boundingBox(), b=await button.boundingBox();
      if (width>600) expect(Math.abs(a.y-b.y)).toBeLessThan(1);
      else expect(b.y).toBeGreaterThanOrEqual(a.y+a.height);
      await button.click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await content.textContent());
      expect(await page.evaluate(measureLayout)).toEqual([]);
    }
    await page.locator('#install-title').evaluate(el => el.scrollIntoView({block:'start'}));
    await page.screenshot({path:`.builds/visual/copy-blocks-${width}-${theme}.png`});
  }
});
