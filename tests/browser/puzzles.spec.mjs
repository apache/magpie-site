import {test,expect} from './fixtures.mjs';
import {mkdir} from 'node:fs/promises';

import {measurePuzzles} from './puzzles.mjs';
import {measureLayout} from './layout.mjs';
import {measureDesign} from './design.mjs';

test('process puzzles mate only through Magpie on desktop and phones',async({page})=>{
  await mkdir('.builds/visual',{recursive:true});
  for(const width of [375,900,1440]) for(const theme of ['light','dark']) {
    await page.setViewportSize({width,height:1100}); await page.goto('/');
    await page.evaluate(theme=>localStorage.setItem('magpie-theme',theme),theme); await page.reload();
    await page.locator('.reel-dot').first().click();
    await expect(page.locator('.reel-flow.puzzle-flow')).toHaveCount(9);
    await expect(page.locator('.lifecycle-flow.puzzle-flow')).toHaveCount(6);
    await expect(page.locator('.card-flow.puzzle-flow')).toHaveCount(1);
    expect(await page.evaluate(measurePuzzles)).toEqual([]);
    expect(await page.evaluate(measureLayout)).toEqual([]);
    expect(await page.evaluate(measureDesign)).toEqual([]);
    for(const [name,selector] of [['hero','.hero'],['lifecycle','#how-it-works'],['rules','#project-rules']]) {
      await page.locator(selector).screenshot({path:`.builds/visual/puzzle-${name}-${width}-${theme}.png`,style:'.site-header,.site-header *, .skip-link {visibility:hidden}'});
    }
    await expect(page.locator('.reel-slide:not([inert]) .magpie-card .workflow-card-emphasis')).toContainText('I’ve got a workflow for this.');
  }
});

test('puzzle checker rejects mismatched joins and matching outside pieces',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');
  const flow=page.locator('.reel-slide:not([inert]) .puzzle-flow');
  await flow.locator('.workflow-card').nth(1).evaluate(el=>el.style.setProperty('--puzzle-in','50%'));
  expect(await page.evaluate(measurePuzzles)).toContain('puzzle connections do not meet');
  await flow.locator('.workflow-card').nth(1).evaluate(el=>el.removeAttribute('style'));
  await flow.locator('.workflow-card').last().evaluate(el=>el.style.setProperty('--puzzle-in','36%'));
  expect(await page.evaluate(measurePuzzles)).toContain('outside pieces fit without Magpie');
});
