import {test,expect} from './fixtures.mjs';
import {mkdir} from 'node:fs/promises';

test('both walkthroughs retain wheel progression in the fitting desktop viewport',async({page})=>{
  await page.setViewportSize({width:1524,height:1180});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
  for(const name of ['security','software']) {
    const scene=page.locator(`.${name}-workbench`).locator('..'), tabs=scene.getByRole('tab');
    await expect(scene).toHaveAttribute('data-scroll-driven','true');
    await tabs.first().click(); const start=await page.evaluate(()=>scrollY);
    await tabs.last().click(); const end=await page.evaluate(()=>scrollY);
    const step=(end-start)/5;
    expect(step).toBeGreaterThan(0);
    await tabs.first().click();
    await page.mouse.move(1500,600);
    for(const index of [1,2,3,4,5,4,3,2,1,0]) {
      await page.mouse.wheel(0,index>Number((await scene.getByRole('tab',{selected:true}).getAttribute('id')).split('-').at(-1))?step:-step);
      await expect(tabs.nth(index)).toHaveAttribute('aria-selected','true');
      await expect(scene.locator('.lifecycle-heading')).toBeInViewport({ratio:1});
    }
    expect(await scene.locator('.sequence-window').evaluate(el=>el.scrollLeft)).toBe(0);
  }
});

for(const width of [375,1524]) test(`sequence shadows retain their full fade at ${width}`,async({page})=>{
  await mkdir('.builds/visual',{recursive:true});
  await page.setViewportSize({width,height:1600});
  for(const theme of ['dark','light']) {
    await page.goto('/');
    await page.evaluate(theme=>localStorage.setItem('magpie-theme',theme),theme); await page.reload();
    await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
    await page.locator('.reel-dot').first().click();
    for(const [name,selector,all,controls] of [
      ['hero','.reel-slide:not([inert]) .puzzle-flow','.reel-slide .puzzle-flow','.reel-dot'],
      ['security','.security-scene:not([inert]) .story-comparison','.security-scene .story-comparison','.security-workbench [role=tab]'],
      ['software','.lifecycle-scene:not([inert]) .puzzle-flow','.lifecycle-scene .puzzle-flow','.software-workbench [role=tab]'],
    ]) {
      // The tallest panel reaches the shared envelope's edge. Shorter panels
      // can accidentally hide clipping behind the rail's reserved empty space.
      const tallest=await page.locator(all).evaluateAll(nodes=>nodes.reduce((best,el,index)=>el.getBoundingClientRect().height>nodes[best].getBoundingClientRect().height?index:best,0));
      await page.locator(controls).nth(tallest).click();
      const surface=page.locator(selector), window=surface.locator('xpath=ancestor::div[contains(@class,"sequence-window")]');
      await surface.evaluate(el=>el.scrollIntoView({block:'end',behavior:'instant'}));
      await page.mouse.wheel(0,160);
      await expect.poll(()=>surface.evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThan(1500);
      const box=await surface.boundingBox();
      const clip={x:Math.floor(box.x+box.width/2-24),y:Math.ceil(box.y+box.height+1),width:48,height:80};
      const actual=await page.screenshot({clip});
      // A reference with clipping removed proves the real painted shadow fits,
      // rather than only checking a padding or overflow constant.
      await window.evaluate(el=>el.style.overflow='visible');
      const reference=await page.screenshot({clip});
      await window.evaluate(el=>el.style.removeProperty('overflow'));
      expect(actual.equals(reference),`${name} ${theme}: the slider cuts off its shadow`).toBe(true);
      // Prove the same comparison catches the reported regression.
      await window.evaluate(el=>{el.style.overflow='clip';el.style.overflowClipMargin='0px';});
      expect((await page.screenshot({clip})).equals(reference),`${name}: broken clipping fixture must be detected`).toBe(false);
      await window.evaluate(el=>el.removeAttribute('style'));
      if(name==='security') await page.screenshot({path:`.builds/visual/shadow-${width}-${theme}.png`});
    }
  }
});
