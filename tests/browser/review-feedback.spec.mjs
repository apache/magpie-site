import { test, expect } from './fixtures.mjs';

for (const seed of [.55,.999]) test.describe(`hero visit seeded ${seed}`, () => {
  test.use({heroRandom:seed});
  test('random initial example advances from its visible state', async ({page}) => {
    await page.setViewportSize({width:1440,height:1100});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.clock.install();
    await page.goto('/');
    await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
    const dots = page.locator('.reel-dot'), count = await dots.count();
    const initial = Math.floor(seed * count);
    await expect(dots.nth(initial)).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('.reel-slide:not([inert])')).toHaveAttribute('aria-label',new RegExp(`^${initial+1} of ${count}:`));
    await page.clock.fastForward(8100);
    await expect(dots.nth((initial+1)%count)).toHaveAttribute('aria-pressed','true');
    await page.getByRole('button',{name:'Next use case',exact:true}).click();
    await page.clock.fastForward(16000);
    await expect(dots.nth((initial+2)%count)).toHaveAttribute('aria-pressed','true');
  });
});

test('section menu and heading links work with keyboard, queries and history', async ({page}) => {
  for (const width of [320,375,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto('/?source=review#overview');
    const menu = page.locator('.home-navigation'), summary = menu.locator('summary');
    const header = page.locator('.header-inner');
    expect(await header.evaluate(el => el.getBoundingClientRect().height)).toBeLessThanOrEqual(width < 801 ? 72 : 80);
    await summary.focus(); await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open','');
    const links = menu.locator('a[href^="#"]');
    await expect(links).toHaveCount(7);
    for (const link of await links.all()) {
      const hash = await link.getAttribute('href');
      await expect(page.locator(hash)).toHaveCount(1);
    }
    await page.keyboard.press('Escape'); await expect(summary).toBeFocused();
    await expect(menu).not.toHaveAttribute('open');
    await summary.click();
    await menu.getByRole('link',{name:'Agent isolation',exact:true}).click();
    await expect(page).toHaveURL(/\?source=review#agent-isolation$/);
    await expect(menu).not.toHaveAttribute('open');
    await expect(page.locator('#agent-isolation')).toBeFocused();
    await expect(page.locator('#agent-isolation .section-heading a')).toHaveAttribute('href','#agent-isolation');
    await page.goBack(); await expect(page).toHaveURL(/\?source=review#overview$/);
    await page.goForward(); await expect(page).toHaveURL(/\?source=review#agent-isolation$/);
    await summary.click(); await page.locator('#agent-isolation .section-heading').click();
    await expect(menu).not.toHaveAttribute('open');
  }
});

test('isolation comparison aligns cards and keeps compact labels legible', async ({page}) => {
  await page.goto('/#agent-isolation');
  for (const width of [375,801,1440]) {
    await page.setViewportSize({width,height:1000});
    await expect(page.locator('.isolation-side .workflow-card-body > p')).toHaveCount(0);
    await expect(page.locator('.exposed-resources > li')).toHaveCount(3);
    await expect(page.locator('.layer-label')).toHaveCount(4);
    await expect(page.locator('.yolo-wildcard')).toContainText('A loan for Hawaii next?');
    if(width<=800) await page.getByRole('button',{name:'In YOLO mode',exact:true}).click();
    const tiles=await page.locator('.exposed-resources > li').evaluateAll(nodes => nodes.map(el => el.getBoundingClientRect().toJSON()));
    for (let i=1;i<tiles.length;i++) expect(tiles[i].top).toBeGreaterThan(tiles[i-1].bottom);
    const diagram=await page.locator('.isolation-open .agent-diagram').boundingBox();
    for (const tile of tiles) { expect(tile.x).toBeGreaterThanOrEqual(diagram.x); expect(tile.x+tile.width).toBeLessThanOrEqual(diagram.x+diagram.width); }
    const cards = await page.locator('.isolation-side').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
    if (width > 800) {
      expect(Math.abs(cards[0]-cards[1])).toBeLessThan(1);
      const layers=await page.locator('.isolation-protected .agent-diagram > .protection-layer').boundingBox();
      const open=await page.locator('.isolation-open .agent-diagram').boundingBox();
      expect(Math.abs(layers.y+layers.height-open.y-open.height)).toBeLessThan(1);
    }
    if(width<=800) await page.getByRole('button',{name:'With Magpie',exact:true}).click();
    for (const label of await page.locator('.layer-label').all()) {
      expect(await label.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    }
    await expect(page.locator('.security-scene .workflow-card-heading').filter({hasText:'Good old days'})).toHaveCount(6);
  }
});
