import { test, expect } from './fixtures.mjs';
import { measureLayout } from './layout.mjs';

export function criticalProgressionTests() {
  test('critical progression: content changes animate subtly and respect reduced motion', async ({page}) => {
    await page.setViewportSize({width:1440,height:1000});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto('/');
    await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
    for (const [controls,active] of [
      ['.reel-dot','#hero-question > [aria-hidden=false]'],
      ['.security-workbench [role=tab]','.security-prompts > [aria-hidden=false]'],
    ]) {
      await page.locator(controls).first().click();
      await page.locator(controls).nth(1).click();
      const transitions = await page.locator(active).evaluate(el => el.getAnimations().map(animation => ({property:animation.transitionProperty,duration:animation.effect.getTiming().duration})));
      expect(transitions.some(t => t.property === 'opacity' && t.duration >= 150 && t.duration <= 400)).toBe(true);
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.locator(controls).nth(2).click();
      expect(await page.locator(active).evaluate(el => el.getAnimations().length)).toBe(0);
      await page.emulateMedia({reducedMotion:'no-preference'});
    }
  });

  test('critical progression: arrows follow the visible sequence without clicking it first', async ({page}) => {
    const widgets = [
      ['.workflow-reel','.reel-dot','aria-pressed'],
      ['.security-workbench','[role=tab]','aria-selected'],
      ['.software-workbench','[role=tab]','aria-selected'],
    ];
    for (const mode of [{width:1524,height:1495,motion:'no-preference'},{width:1524,height:700,motion:'no-preference'},{width:375,height:900,motion:'reduce'}]) {
      await page.setViewportSize({width:mode.width,height:mode.height});
      await page.emulateMedia({reducedMotion:mode.motion});
      await page.goto('/');
      await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
      for (const [selector,control,attribute] of widgets) {
        const panel = page.locator(selector), controls = panel.locator(control);
        await page.mouse.move(mode.width-10,mode.height/2);
        await page.mouse.wheel(0,await panel.evaluate(el => el.getBoundingClientRect().top-120));
        await expect.poll(() => panel.evaluate(el => {
          const r = el.getBoundingClientRect();
          return (Math.min(innerHeight,r.bottom)-Math.max(80,r.top))/Math.min(innerHeight-80,r.height);
        })).toBeGreaterThan(.5);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const before = await controls.evaluateAll((nodes,attribute) => nodes.findIndex(el => el.getAttribute(attribute) === 'true'),attribute);
        const next = (before+1) % await controls.count();
        await page.keyboard.press('ArrowRight');
        await expect(controls.nth(next)).toHaveAttribute(attribute,'true');
        await page.keyboard.press('ArrowLeft');
        await expect(controls.nth(before)).toHaveAttribute(attribute,'true');
        // Scrolling to the next widget intentionally leaves focus in the old
        // one. An offscreen control must not keep ownership of arrow keys.
      }
      const lifecycle = page.locator('.software-workbench [role=tab][aria-selected=true]');
      const selected = await lifecycle.getAttribute('id');
      await page.evaluate(() => {
        const field = document.createElement('input');
        field.id = 'keyboard-edit-fixture'; field.value = 'abcd';
        field.style.cssText = 'position:fixed;top:100px;left:20px;z-index:100';
        document.body.append(field);
      });
      const field = page.locator('#keyboard-edit-fixture');
      await field.focus();
      await field.evaluate(el => el.setSelectionRange(0,0));
      await field.press('ArrowRight');
      expect(await field.evaluate(el => el.selectionStart)).toBe(1);
      await expect(lifecycle).toHaveAttribute('id',selected);
      await field.evaluate(el => el.remove());
      // Focus must not introduce an unrelated scroll-driven stage change.
      const scrollBeforeFocus=await page.evaluate(()=>scrollY);
      await page.locator('.theme-toggle').evaluate(el=>el.focus({preventScroll:true}));
      expect(await page.evaluate(()=>scrollY)).toBe(scrollBeforeFocus);
      await page.keyboard.press('ArrowRight');
      await expect(lifecycle).toHaveAttribute('id',selected);
    }
  });

  test('critical progression: every hero slide, autoplay loop, hover, focus and manual selection', async ({page}) => {
    await page.setViewportSize({width:1440,height:1100});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.clock.install();
    await page.goto('/');
    await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
    const reel = page.locator('.reel-window'), dots = page.locator('.reel-dot');
    const region = page.getByRole('region',{name:'Nine ways maintainers use Magpie'});
    await expect(reel).toHaveAttribute('aria-live','off');
    const count = await dots.count();
    expect(count).toBeGreaterThan(1);
    const targets = await dots.evaluateAll(nodes => nodes.map(el => ({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})));
    expect(targets.every(r => r.width >= 44)).toBe(true);
    expect(targets.slice(1).every((r,i) => r.left-targets[i].right >= 11.5)).toBe(true);
    await expect(page.locator('.example-navigation button')).toHaveCount(count);
    const selected = async index => {
      await expect(dots.nth(index)).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('.reel-slide:not([inert])')).toHaveCount(1);
      await expect(page.locator('.reel-slide:not([inert])')).toHaveAttribute('aria-label',new RegExp(`^${index+1} of ${count}:`));
      await expect(page.locator('#hero-question > [aria-hidden=false]')).toHaveCount(1);
    };
    for (let i=1;i<=count;i++) { await page.clock.fastForward(8100); await selected(i%count); }
    await reel.hover(); await expect(reel).toHaveAttribute('aria-live','polite');
    await page.clock.fastForward(16000); await selected(0);
    await page.mouse.move(0,0); await expect(reel).toHaveAttribute('aria-live','off');
    await page.clock.fastForward(8100); await selected(1);
    await region.focus(); await expect(reel).toHaveAttribute('aria-live','polite');
    await page.clock.fastForward(16000); await selected(1);
    await page.keyboard.press('Shift+Tab'); await expect(reel).toHaveAttribute('aria-live','off');
    await page.clock.fastForward(8100); await selected(2);
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect(reel).toHaveAttribute('aria-live','polite');
    await page.clock.fastForward(16000); await selected(2);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await expect(reel).toHaveAttribute('aria-live','off');
    await page.clock.fastForward(8100); await selected(3);
    await region.focus(); await page.keyboard.press('ArrowRight'); await selected(4);
    await page.locator('#hero-title').click(); await page.mouse.move(0,0);
    await expect(reel).toHaveAttribute('aria-live','polite');
    await page.clock.fastForward(16000); await selected(4);
    for (let i=0;i<count;i++) { await dots.nth(i).click(); await selected(i); }
    await region.getByRole('button',{name:'Next use case',exact:true}).click(); await selected(0);
    await region.getByRole('button',{name:'Previous use case',exact:true}).click(); await selected(count-1);
    await page.locator('#hero-title').click(); await page.mouse.move(0,0);
    await page.clock.fastForward(16000); await selected(count-1);
    await dots.first().focus(); await page.keyboard.press('Enter'); await selected(0);
    await page.keyboard.press('Tab'); await page.keyboard.press('Space'); await selected(1);
    // Manual selection stays stopped after both hover and keyboard focus leave,
    // including when the system motion preference changes later.
    await page.locator('#hero-title').click(); await page.mouse.move(0,0);
    await expect(reel).toHaveAttribute('aria-live','polite');
    await page.clock.fastForward(16000); await selected(1);
    await region.focus(); await page.keyboard.press('Home'); await selected(0);
    for (let i=1;i<=count;i++) {
      await page.keyboard.press('ArrowRight'); await selected(i%count);
      await expect(dots.nth(i%count)).toBeFocused();
    }
    await page.keyboard.press('ArrowLeft'); await selected(count-1);
    await page.keyboard.press('Home'); await selected(0);
    await page.keyboard.press('End'); await selected(count-1);
    await page.keyboard.press('Shift+ArrowRight'); await selected(count-1);
    await page.locator('#hero-title').click(); await page.mouse.move(0,0);
    await page.clock.fastForward(16000); await selected(count-1);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await expect(reel).toHaveAttribute('aria-live','polite');
    await page.clock.fastForward(16000); await selected(count-1);
  });

  test.describe('touch carousel controls', () => {
    test.use({hasTouch:true, isMobile:true, viewport:{width:430,height:932}});
    test('critical progression: tapping a dot selects and stops autoplay without hover', async ({page}) => {
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.clock.install();
      await page.goto('/');
      await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
      const dots = page.locator('.reel-dot');
      await dots.nth(2).tap();
      await expect(dots.nth(2)).toHaveAttribute('aria-pressed','true');
      await page.locator('#hero-title').tap();
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.clock.fastForward(24000);
      await expect(dots.nth(2)).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('.reel-window')).toHaveAttribute('aria-live','polite');
      await dots.nth(5).tap();
      await expect(dots.nth(5)).toHaveAttribute('aria-pressed','true');
      await page.getByRole('button',{name:'Next use case',exact:true}).tap();
      await expect(dots.nth(6)).toHaveAttribute('aria-pressed','true');
      await page.getByRole('button',{name:'Previous use case',exact:true}).tap();
      await expect(dots.nth(5)).toHaveAttribute('aria-pressed','true');
    });
  });

  for (const [selector,name] of [['.software-lifecycle','Software lifecycle phases'],['.security-walkthrough','Security lifecycle phases']]) {
    test(`critical progression: ${name}, all controls, keyboard, scroll and responsive modes`, async ({page}) => {
      await page.setViewportSize({width:1524,height:1495});
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.goto('/');
      await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
      const scene = page.locator(selector), tabs = scene.getByRole('tablist',{name}).getByRole('tab');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(1);
      await expect(scene).toHaveAttribute('data-scroll-driven','true');
      const selected = async index => {
        await expect(tabs.nth(index)).toHaveAttribute('aria-selected','true');
        await expect(scene.locator('[role=tabpanel]:not([inert])')).toHaveCount(1);
        await expect(scene.locator('[role=tabpanel]:not([inert])')).toHaveAttribute('id',await tabs.nth(index).getAttribute('aria-controls'));
        await expect(scene.locator('[role=tabpanel]:not([inert])')).toBeVisible();
        if (await scene.getAttribute('data-scroll-driven') === 'true') {
          const title = scene.locator('.lifecycle-heading > :is(h2,h3)');
          await expect(title).toBeInViewport({ratio:1});
          expect(await title.evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(80);
        }
        if (selector === '.software-lifecycle') {
          const panel = scene.locator('[role=tabpanel]:not([inert])');
          expect(await panel.locator('.workflow-card').evaluateAll(nodes => nodes.map(el => el.dataset.cardTone))).toEqual(['manual','prepared','result']);
          await expect(panel.locator('.card-badge')).toHaveCount(3);
          await expect(scene.locator('.sequence-navigation-middle a')).toHaveAttribute('target','_blank');
          await expect(scene.locator('.sequence-navigation-middle a')).toContainText((await tabs.nth(index).innerText()).replace(/^\d+\s*/, '').trim().toLowerCase());
        }
      };
      for (let i=0;i<count;i++) { await tabs.nth(i).click(); await selected(i); }
      await tabs.last().press('Home'); await selected(0); await expect(tabs.first()).toBeFocused();
      for (let i=1;i<count;i++) { await page.keyboard.press('ArrowRight'); await selected(i); await expect(tabs.nth(i)).toBeFocused(); }
      await page.keyboard.press('ArrowRight'); await selected(0);
      await page.keyboard.press('ArrowLeft'); await selected(count-1);
      await page.keyboard.press('Home'); await selected(0);
      // The same keys work from the stage content, not only its tab button.
      await scene.locator('[role=tabpanel]:not([inert])').focus();
      await expect(scene.locator('[role=tabpanel]:not([inert])')).toBeFocused();
      await page.keyboard.press('ArrowLeft'); await selected(count-1);
      await expect(tabs.last()).toBeFocused();
      await scene.locator('[role=tabpanel]:not([inert])').focus();
      await page.keyboard.press('ArrowRight'); await selected(0);
      await expect(tabs.first()).toBeFocused();
      await page.keyboard.press('Shift+ArrowRight'); await selected(0);
      const controlName = selector === '.security-walkthrough' ? 'security stage' : 'skill family';
      const previous = scene.getByRole('button',{name:`Previous ${controlName}`,exact:true});
      const next = scene.getByRole('button',{name:new RegExp(`^Next ${controlName}`)});
      await expect(previous).toBeDisabled();
      for (let i=1;i<count;i++) { await next.click(); await selected(i); }
      await expect(next).toBeDisabled();
      for (let i=count-2;i>=0;i--) { await previous.click(); await selected(i); }
      // Actual wheel scrolling must reveal every stage, then reverse cleanly.
      await tabs.first().click();
      const start = await page.evaluate(() => scrollY);
      await tabs.last().click();
      const end = await page.evaluate(() => scrollY);
      const step = (end-start)/(count-1);
      expect(step).toBeGreaterThan(0);
      await tabs.first().click();
      await page.mouse.move(1500,800);
      for (let i=1;i<count;i++) { await page.mouse.wheel(0,step); await selected(i); }
      for (let i=count-2;i>=0;i--) { await page.mouse.wheel(0,-step); await selected(i); }
      for (const mode of [{width:320,height:900,motion:'no-preference'},{width:1524,height:700,motion:'no-preference'},{width:1524,height:1495,motion:'reduce'}]) {
        await page.setViewportSize({width:mode.width,height:mode.height});
        await page.emulateMedia({reducedMotion:mode.motion});
        await expect(scene).toHaveAttribute('data-scroll-driven','false');
        for (let i=0;i<count;i++) { await tabs.nth(i).click(); await selected(i); }
        await scene.locator('[role=tabpanel]:not([inert])').focus();
        // On a phone the content is taller than the viewport. Keep navigating
        // from its bottom even after keyboard focus moves to an offscreen tab.
        if (mode.width === 320) await scene.locator('[role=tabpanel]:not([inert])').evaluate(el => el.scrollIntoView({block:'end',behavior:'instant'}));
        await page.keyboard.press('ArrowRight'); await selected(0);
        await page.keyboard.press('End'); await selected(count-1);
        await page.keyboard.press('Home'); await selected(0);
        await expect.poll(() => page.evaluate(measureLayout)).toEqual([]);
      }
    });
  }

}
