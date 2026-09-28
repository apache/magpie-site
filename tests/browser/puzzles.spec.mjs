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
    if(width<=1100) await page.getByLabel('Try an example').selectOption('0');
    else await page.locator('.reel-dot').first().click();
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

test('compact sequence cards keep shared padding and readable text',async({page})=>{
  await page.setViewportSize({width:1280,height:800}); await page.goto('/');
  expect(await page.evaluate(measureDesign)).toEqual([]);
  const card=page.locator('.software-lifecycle [aria-hidden=false] .workflow-card').first();
  await card.evaluate(el=>el.style.padding='48px');
  expect((await page.evaluate(measureDesign)).some(error=>error.startsWith('card padding:'))).toBe(true);
});

test('puzzle checker rejects mismatched joins and matching outside pieces',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');
  const flow=page.locator('.reel-slide:not([inert]) .puzzle-flow');
  await flow.locator('.workflow-card').nth(1).evaluate(el=>el.style.setProperty('--puzzle-in','.5'));
  expect(await page.evaluate(measurePuzzles)).toContain('puzzle connections do not meet');
  await flow.locator('.workflow-card').nth(1).evaluate(el=>el.removeAttribute('style'));
  await flow.locator('.workflow-card').last().evaluate(el=>el.style.setProperty('--puzzle-in','.36'));
  expect(await page.evaluate(measurePuzzles)).toContain('outside pieces fit without Magpie');
});

test('joined pieces share one external shadow',async({page})=>{
  await page.goto('/');
  expect(await page.evaluate(measurePuzzles)).toEqual([]);
  const flow=page.locator('.reel-slide:not([inert]) .puzzle-flow');
  await flow.locator('.workflow-card').first().evaluate(el=>el.style.filter='drop-shadow(0 5px 5px #0008)');
  expect(await page.evaluate(measurePuzzles)).toContain('puzzle pieces cast shadows on one another');
  expect(await page.evaluate(measureDesign)).toContain('inconsistent puzzle shadow');
  await flow.locator('.workflow-card').first().evaluate(el=>el.style.removeProperty('filter'));
  await flow.evaluate(el=>el.style.filter='none');
  expect(await page.evaluate(measurePuzzles)).toContain('puzzle group has no silhouette shadow');
});

test('plain outside edges and displaced workspace contents fail the visual contract',async({page})=>{
  await page.goto('/');
  const flow=page.locator('.reel-slide:not([inert]) .puzzle-flow');
  await flow.evaluate(el=>el.style.columnGap='4px');
  expect(await page.evaluate(measurePuzzles)).toContain('puzzle pieces leave an open seam');
  await flow.evaluate(el=>el.style.removeProperty('column-gap'));
  const piece=flow.locator('.workflow-card').first();
  await piece.evaluate(el=>el.style.setProperty('--piece-cross-cap','linear-gradient(transparent,transparent)'));
  expect(await page.evaluate(measurePuzzles)).toContain('missing multi-sided puzzle silhouette');
  await page.locator('.protected-workspace').evaluate(el=>el.style.alignItems='flex-start');
  expect(await page.evaluate(measureLayout)).toContain('workspace contents are not centered');
});

for (const width of [375,1440]) test(`pieces assemble once and pass light through the connection at ${width}`,async({page})=>{
  await mkdir('.builds/visual',{recursive:true});
  await page.setViewportSize({width,height:1100});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await expect(page.locator('.reel-slide:not([inert]) .puzzle-flow')).toHaveAttribute('data-puzzle-ready','true');
  const flow=page.locator('.reel-slide:not([inert]) .puzzle-flow');
  if(width<=1100) {
    expect(await flow.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.animationName?.startsWith('puzzle-')).length)).toBe(0);
    expect(await page.evaluate(measurePuzzles)).toEqual([]);
    await page.getByLabel('Try an example').selectOption('1');
    expect(await page.evaluate(measurePuzzles)).toEqual([]);
    return;
  }
  await expect(flow).toHaveAttribute('data-puzzle-shine','true');
  const sample=async(time)=>flow.evaluate((el,time)=>{
    const animations=el.getAnimations({subtree:true}).filter(a=>a.animationName?.startsWith('puzzle-'));
    animations.forEach(a=>{a.pause();a.currentTime=time;});
    const cards=[...el.children], boxes=cards.map(card=>card.getBoundingClientRect()), horizontal=getComputedStyle(el).gridTemplateColumns.split(' ').length>1;
    return {count:animations.length,gaps:boxes.slice(1).map((b,i)=>horizontal?b.left-boxes[i].right:b.top-boxes[i].bottom),filters:[getComputedStyle(el).filter,...cards.map(c=>getComputedStyle(c).filter)],light:cards.map(c=>getComputedStyle(c,'::before').backgroundPosition),iterations:animations.map(a=>a.effect.getTiming().iterations)};
  },time);
  const apart=await sample(100);
  expect(apart.count).toBe(6); expect(apart.gaps.every(g=>g>=40)).toBe(true);
  expect(apart.iterations.every(i=>i===1)).toBe(true);
  await flow.screenshot({path:`.builds/visual/puzzle-apart-${width}.png`});
  const joined=await sample(1300);
  expect(joined.gaps.every(g=>Math.abs(g)<=.5)).toBe(true);
  expect(joined.filters).toEqual(apart.filters);
  expect(new Set(joined.light).size).toBeGreaterThan(1);
  await flow.screenshot({path:`.builds/visual/puzzle-connection-light-${width}.png`});
  const settled=await sample(3000);
  expect(settled.filters).toEqual(apart.filters);
  expect(await page.evaluate(measurePuzzles)).toEqual([]);
  await flow.screenshot({path:`.builds/visual/puzzle-assembled-${width}.png`});
  await page.locator('.reel-dot').nth(1).click();
  await expect(flow).not.toHaveAttribute('data-puzzle-shine');
  expect(await flow.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.animationName?.startsWith('puzzle-')).length)).toBe(0);
  await page.locator('.reel-dot').first().click();
  await expect(flow).not.toHaveAttribute('data-puzzle-shine');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await flow.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.animationName?.startsWith('puzzle-')).length)).toBe(0);
  expect(await page.evaluate(measurePuzzles)).toEqual([]);
});
