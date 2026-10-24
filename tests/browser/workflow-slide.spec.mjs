import {test,expect} from './fixtures.mjs';
import {mkdir} from 'node:fs/promises';

// Sample the actual moving ancestor, whether a panel or a shared carousel rail.
// A click's slide can start a frame or two after the click on a slow runner, so
// wait for it in the page, up to 2s, and pause it in the frame it is found.
async function sampleSlide(panel, progress) {
  return panel.evaluate(async (el,progress)=>{
    const sliding=()=>{
      const found=[];
      for(let node=el;node&&!node.matches('.sequence-navigation');node=node.parentElement) {
        found.push(...node.getAnimations().filter(a=>a.transitionProperty==='transform'));
      }
      return found;
    };
    const until=performance.now()+2000;
    let animations=sliding();
    while(!animations.length&&performance.now()<until) {
      await new Promise(resolve=>requestAnimationFrame(resolve));
      animations=sliding();
    }
    for(const animation of animations) {
      animation.pause(); animation.currentTime=Number(animation.effect.getTiming().duration)*progress;
    }
    const r=el.getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height,moving:animations.length};
  },progress);
}

// Reaching a scroll-driven walkthrough can already move it off its first stage,
// so selecting that stage starts a slide of its own. Measure from rest, and
// after the puzzle introduction: it plays once, on the first panel that is both
// active and seen, and on a slow runner the observer reporting "seen" can come
// after the next click, which moves the introduction onto the next panel.
async function settle(workbench) {
  if(await workbench.locator('.puzzle-flow').count())
    await expect(workbench.locator('[role=tabpanel]:not([inert]) .puzzle-flow[data-puzzle-ready]')).toHaveCount(1);
  await workbench.evaluate(el=>Promise.all(el.getAnimations({subtree:true})
    .filter(a=>(a.transitionProperty==='transform'||a.animationName?.startsWith('puzzle-'))&&a.playState==='running').map(a=>a.finished)));
}

for(const width of [1280,1524]) test(`workflow panels slide horizontally without vertical jumps at ${width}`,async({page})=>{
  await mkdir('.builds/visual',{recursive:true});
  await page.setViewportSize({width,height:1495});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
  for(const name of ['software','security']) {
    const workbench=page.locator(`.${name}-workbench`), tabs=workbench.getByRole('tab');
    await tabs.first().click();
    await settle(workbench);
    // Move in both directions, including a direct jump to a distant stage.
    for(const index of [1,4,0]) {
      const before=await workbench.boundingBox();
      await tabs.nth(index).click();
      const panel=workbench.locator('[role=tabpanel]:not([inert])');
      const start=await sampleSlide(panel,0), middle=await sampleSlide(panel,.5);
      const end=await sampleSlide(panel,1);
      expect(start.moving).toBeGreaterThan(0);
      expect(Math.abs(start.x-end.x)).toBeGreaterThan(end.width*.8);
      expect(Math.abs(middle.x-end.x)).toBeGreaterThan(1);
      expect(Math.abs(middle.x-end.x)).toBeLessThan(Math.abs(start.x-end.x));
      expect(Math.abs(start.y-end.y)).toBeLessThan(1);
      expect(Math.abs(start.height-end.height)).toBeLessThan(1);
      expect(Math.abs((await workbench.boundingBox()).height-before.height)).toBeLessThan(1);
      expect(await panel.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.animationName==='puzzle-fit').length)).toBe(0);
      await expect(workbench.locator('[role=tabpanel]:not([inert])')).toHaveCount(1);
      expect(await workbench.locator('.sequence-window').evaluate(el=>el.scrollLeft)).toBe(0);
    }
    await workbench.screenshot({path:`.builds/visual/${name}-slide-${width}.png`,style:'.site-header,.skip-link{visibility:hidden}'});
    // Screenshot capture scrolls tall phone panels; keep it outside geometry sampling.
    await tabs.nth(1).click();
    const movingPanel=workbench.locator('[role=tabpanel]:not([inert])');
    await sampleSlide(movingPanel,.5);
    await workbench.screenshot({path:`.builds/visual/${name}-slide-midway-${width}.png`,style:'.site-header,.skip-link{visibility:hidden}'});
    await sampleSlide(movingPanel,1);
    await page.emulateMedia({reducedMotion:'reduce'});
    await tabs.nth(2).click();
    expect((await sampleSlide(workbench.locator('[role=tabpanel]:not([inert])'),.5)).moving).toBe(0);
    await page.emulateMedia({reducedMotion:'no-preference'});
  }
});
