import { test, expect } from './fixtures.mjs';

async function readSection(page, selector) {
  const delta = await page.locator(selector).evaluate(el => el.getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom - 12);
  await page.mouse.wheel(0, delta);
}

for (const width of [375, 1440]) test(`passive section URLs preserve navigation and selected content at ${width}px`, async ({page}) => {
  await page.setViewportSize({width, height:900});
  await page.goto('/brand');
  await page.goto('/?campaign=reading');
  await page.evaluate(() => document.fonts.ready);
  const selected = page.locator('.reel-dot').nth(2);
  await selected.click();
  const baseline = await page.evaluate(() => {
    history.replaceState({...history.state, readingTest:'preserve'}, '', location.href);
    return history.length;
  });
  for (const id of ['airflow', 'how-it-works', 'learning']) {
    await readSection(page, '#'+id);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#'+id);
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await expect(selected).toBeFocused();
    expect(await page.evaluate(() => ({length:history.length, state:history.state.readingTest, query:location.search})))
      .toEqual({length:baseline, state:'preserve', query:'?campaign=reading'});
  }
  await page.goBack();
  await expect(page).toHaveURL(/\/brand\/?$/);
  await page.goForward();
  await expect(page).toHaveURL(/\?campaign=reading#learning$/);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.site-header .brand-lockup').focus();
  await page.keyboard.press('Home');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page).toHaveURL(/\?campaign=reading$/);
});

test('precise deep links survive layout and in-section interactions', async ({page}) => {
  await page.goto('/?campaign=deep#security-example-title');
  await page.evaluate(() => document.fonts.ready);
  const phases = page.getByRole('tablist', {name:'Security lifecycle phases'});
  await phases.getByRole('tab', {name:'Triage', exact:true}).click();
  await expect(phases.getByRole('tab', {name:'Triage', exact:true})).toHaveAttribute('aria-selected', 'true');
  await page.mouse.wheel(0, 100);
  await expect(page).toHaveURL(/\?campaign=deep#security-example-title$/);
  await readSection(page, '#how-it-works');
  await expect(page).toHaveURL(/\?campaign=deep#how-it-works$/);
});

test('documentation reading positions use heading anchors without adding history', async ({page}) => {
  await page.goto('/docs/setup/secure-agent-setup?campaign=docs');
  await page.evaluate(() => document.fonts.ready);
  const headings = page.locator('.docs-prose h2[id]');
  expect(await headings.count()).toBeGreaterThan(1);
  const id = await headings.nth(1).getAttribute('id');
  const length = await page.evaluate(() => history.length);
  await readSection(page, '.docs-prose h2[id="'+id+'"]');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#'+id);
  expect(await page.evaluate(() => history.length)).toBe(length);
  expect(await page.evaluate(() => location.search)).toBe('?campaign=docs');
});
