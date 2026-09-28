import {test,expect} from './fixtures.mjs';
import {mkdir} from 'node:fs/promises';

for(const width of [375,1524]) test(`sequence shadows retain their full fade at ${width}`,async({page})=>{
  await mkdir('.builds/visual',{recursive:true});
  await page.setViewportSize({width,height:1600});
  for(const theme of ['dark','light']) {
    await page.goto('/');
    await page.evaluate(theme=>localStorage.setItem('magpie-theme',theme),theme); await page.reload();
    await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
    await page.evaluate(()=>document.fonts.ready);
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
      const before=await page.evaluate(()=>scrollY);
      await page.mouse.wheel(0,160);
      await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThanOrEqual(before+159);
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
