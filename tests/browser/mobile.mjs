import { test, expect } from './fixtures.mjs';
import { mkdir } from 'node:fs/promises';
import { measureLayout } from './layout.mjs';
import { measureDesign } from './design.mjs';

export function mobileExperienceTests() {
function measureMobileHero() {
  const errors=[], hero=document.querySelector('#overview'), cta=document.querySelector('.hero-start');
  if(hero.getBoundingClientRect().height>(innerWidth===320?1500:1300)) errors.push('oversized phone hero');
  const action=cta.getBoundingClientRect();
  if(action.bottom>innerHeight || action.height<44) errors.push('phone introduction lacks a reachable action');
  return errors;
}

for (const width of [320,390,768,1024]) test(`mobile reading flow stays usable at ${width}`,async({page})=>{
  await mkdir('.builds/visual',{recursive:true});
  await page.setViewportSize({width,height:844});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
  await expect(page.locator('.hero-start')).toBeInViewport({ratio:1});
  expect(await page.evaluate(measureMobileHero)).toEqual([]);
  const picker=page.getByLabel('Try an example');
  await expect(picker).toBeVisible();
  for(let i=0;i<9;i++) {
    await picker.selectOption(String(i));
    await expect(page.locator('.reel-slide:not([inert])')).toHaveAttribute('aria-label',new RegExp(`^${i+1} of 9:`));
    await expect.poll(()=>page.evaluate(measureLayout)).toEqual([]);
    await expect.poll(()=>page.evaluate(measureDesign)).toEqual([]);
  }
  await picker.selectOption('2');
  await page.locator('#hero-title').scrollIntoViewIfNeeded();
  await page.screenshot({path:`.builds/visual/mobile-hero-${width}.png`});
  for(const selector of ['.security-walkthrough','.software-lifecycle']) {
    const scene=page.locator(selector), rows=scene.locator('.mobile-workflow');
    await expect(scene).toHaveAttribute('data-scroll-driven','false');
    await expect(scene.locator('.workflow-sequence-content')).toBeHidden();
    await expect(rows).toHaveCount(6);
    for(let i=0;i<6;i++) {
      await rows.nth(i).locator(':scope > summary').click();
      await expect(scene.locator('.mobile-workflow[open]')).toHaveCount(1);
      await expect(rows.nth(i).locator('.mobile-workflow-body')).toBeVisible();
      await expect(rows.nth(i).locator('.mobile-workflow-body > .workflow-checklist > li')).toHaveCount(3);
      if(selector==='.software-lifecycle') {
        await expect(rows.nth(i).locator('.mobile-workflow-context')).not.toBeEmpty();
        await expect(rows.nth(i).locator('.mobile-workflow-result .workflow-checklist > li')).toHaveCount(3);
      } else {
        await rows.nth(i).locator('.mobile-workflow-before > summary').click();
        await expect(rows.nth(i).locator('.mobile-workflow-before .workflow-checklist')).toBeVisible();
        await expect(rows.nth(i).locator('.mobile-workflow-before .workflow-checklist > li')).toHaveCount(3);
      }
      await expect.poll(()=>page.evaluate(measureLayout)).toEqual([]);
    }
    await rows.last().locator(':scope > summary').press('Enter');
    await expect(scene.locator('.mobile-workflow[open]')).toHaveCount(0);
  }
  await page.locator('#how-it-works').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  await page.screenshot({path:`.builds/visual/mobile-workflows-${width}.png`});
  if(width<=800) {
    await expect(page.locator('.isolation-protected')).toBeVisible();
    await expect(page.locator('.isolation-open')).toBeHidden();
    await page.getByRole('button',{name:'In YOLO mode',exact:true}).click();
    await expect(page.locator('.isolation-open')).toBeVisible();
    await expect(page.locator('.exposed-resources > li')).toHaveCount(3);
    await page.getByRole('button',{name:'With Magpie',exact:true}).click();
    await expect(page.locator('.isolation-protected')).toBeVisible();
    expect(await page.locator('.layer-label').first().evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(170);
    await page.locator('#agent-isolation').screenshot({path:`.builds/visual/mobile-isolation-${width}.png`});
  }
  await page.setViewportSize({width:1440,height:900});
  await expect(page.locator('.software-lifecycle')).toHaveAttribute('data-scroll-driven','true');
  await expect(page.locator('.software-lifecycle .mobile-workflows')).toBeHidden();
  await expect(page.locator('.software-lifecycle .workflow-sequence-content')).toBeVisible();
});

test('phone examples stay still and disclosures retain ordinary keyboard access',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.clock.install();
  await page.goto('/');
  const picker=page.getByLabel('Try an example');
  await expect(picker).toHaveValue('0');
  await page.clock.fastForward(24000);
  await expect(picker).toHaveValue('0');
  await page.locator('.workflow-reel').focus();
  await page.keyboard.press('ArrowRight');
  await expect(picker).toHaveValue('0');
  await picker.selectOption('4');
  await page.clock.fastForward(24000);
  await expect(picker).toHaveValue('4');
  const summary=page.locator('.software-lifecycle .mobile-workflow > summary').first();
  await summary.focus(); await summary.press('Enter');
  await expect(page.locator('.software-lifecycle .mobile-workflow').first()).toHaveAttribute('open','');
  await summary.press('Tab');
  await expect(page.locator('.software-lifecycle .mobile-workflow').first().getByRole('link')).toBeFocused();
});

test('phone bounds detect oversized introductions and open disclosure overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  expect(await page.evaluate(measureMobileHero)).toEqual([]);
  await page.locator('#overview').evaluate(el=>el.style.minHeight='1800px');
  expect(await page.evaluate(measureMobileHero)).toContain('oversized phone hero');
  await page.locator('#overview').evaluate(el=>el.removeAttribute('style'));
  const row=page.locator('.security-walkthrough .mobile-workflow').first();
  await row.locator('.mobile-workflow-body').evaluate(el=>el.style.width='700px');
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await row.locator(':scope > summary').click();
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('document overflow');
  await row.locator('.mobile-workflow-body').evaluate(el=>el.removeAttribute('style'));
  expect(await page.evaluate(measureLayout)).toEqual([]);
});

for(const theme of ['light','dark']) test(`phone docs entry and controls remain compact in ${theme}`,async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(value=>localStorage.setItem('magpie-theme',value),theme);
  await page.goto('/docs');
  await expect(page.locator('.docs-workflow-link')).toHaveCount(4);
  await expect(page.locator('.docs-workflow-cards')).toBeHidden();
  expect(await page.locator('.site-header').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThanOrEqual(80);
  expect(await page.locator('.docs-workflow-links').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThan(550);
  await expect.poll(()=>page.evaluate(measureLayout)).toEqual([]);
  await page.screenshot({path:`.builds/visual/mobile-docs-${theme}.png`,fullPage:true});
  await page.getByRole('button',{name:'Browse documentation'}).click();
  await expect(page.locator('.docs-sidebar')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.docs-sidebar')).toBeHidden();
  await page.locator('.docs-workflow-link').first().click();
  await expect(page).toHaveURL(/\/docs\/security\/readme\/?$/);
});

}
