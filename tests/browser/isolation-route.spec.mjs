import {test,expect} from './fixtures.mjs';
import {mkdir} from 'node:fs/promises';
import {measureLayout} from './layout.mjs';

function inspectRoute() {
  const diagram=document.querySelector('.isolation-protected .agent-diagram');
  const origin=diagram.getBoundingClientRect();
  const points=[...diagram.querySelector('polyline').points].map(p=>({x:p.x+origin.left,y:p.y+origin.top}));
  const errors=[];
  if (points.length<2) return ['missing access route'];
  const segments=points.slice(1).map((b,i)=>[points[i],b]);
  const workspace=diagram.querySelector('.protected-workspace').getBoundingClientRect();
  const agent=diagram.querySelector('.diagram-agent').getBoundingClientRect();
  const icon=diagram.querySelector('.protected-workspace > svg').getBoundingClientRect();
  const end=points.at(-1);
  if (Math.abs(points[0].x-(agent.left+agent.right)/2)>1 || points[0].y<agent.bottom) errors.push('route misses agent');
  if (Math.abs(end.x-(workspace.left+workspace.right)/2)>1 || end.y<workspace.top+8 || end.y>icon.top-4) errors.push('route misses workspace');
  for (const layer of diagram.querySelectorAll('.protection-layer')) {
    // Mobile uses full-width labels in a single boundary so they remain
    // readable. The route must still pass each layer's top in order.
    const r=(getComputedStyle(layer).display==='contents'?layer.querySelector('.layer-label'):layer).getBoundingClientRect();
    if (!segments.some(([a,b])=>Math.abs(a.x-b.x)<1 && a.x>r.left && a.x<r.right && Math.min(a.y,b.y)<r.top && Math.max(a.y,b.y)>r.top)) errors.push('route skips a protection layer');
  }
  for (const label of diagram.querySelectorAll('.layer-label > span,.layer-label > svg')) {
    const r=label.getBoundingClientRect();
    if (segments.some(([a,b])=>Math.max(a.x,b.x)>r.left && Math.min(a.x,b.x)<r.right && Math.max(a.y,b.y)>r.top && Math.min(a.y,b.y)<r.bottom)) errors.push('route crosses a label');
  }
  return errors;
}

test('agent access passes through every boundary into the workspace without crossing labels',async({page})=>{
  await mkdir('.builds/visual',{recursive:true});
  await page.goto('/#agent-isolation');
  for (const width of [320,375,801,1440]) for (const theme of ['light','dark']) {
    await page.setViewportSize({width,height:1100});
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await expect.poll(()=>page.evaluate(inspectRoute)).toEqual([]);
    expect(await page.evaluate(measureLayout)).toEqual([]);
    await page.locator('#agent-isolation').screenshot({path:`.builds/visual/isolation-route-${width}-${theme}.png`,style:'.site-header,.skip-link{visibility:hidden}'});
  }
  const route=page.locator('.protection-route polyline');
  const valid=await route.getAttribute('points');
  await route.evaluate(el=>el.setAttribute('points','0,0 0,20'));
  expect(await page.evaluate(inspectRoute)).toContain('route misses workspace');
  await route.evaluate((el,value)=>el.setAttribute('points',value),valid);
  await route.evaluate(el=>{
    const origin=el.closest('.agent-diagram').getBoundingClientRect();
    const label=el.closest('.agent-diagram').querySelector('.layer-label > span').getBoundingClientRect();
    const x=(label.left+label.right)/2-origin.left;
    el.setAttribute('points',`${x},${label.top-origin.top-5} ${x},${label.bottom-origin.top+5}`);
  });
  expect(await page.evaluate(inspectRoute)).toContain('route crosses a label');
});
