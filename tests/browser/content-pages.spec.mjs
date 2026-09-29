import { test, expect } from './fixtures.mjs';
import { readFileSync } from 'node:fs';
import { measureLayout } from './layout.mjs';
import { measureDesign } from './design.mjs';

if (!process.env.MAGPIE_TEST_MANIFEST) throw new Error('Use npm run test:browser so tests own a fresh build and server.');
// The page is generated from the same data; the tests follow it.
const data = JSON.parse(readFileSync('src/data/tools.json', 'utf8'));
const neutrality = data.vendorNeutrality;
const checkLayout = async page => {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect.poll(() => page.evaluate(measureLayout)).toEqual([]);
  expect(await page.evaluate(measureDesign)).toEqual([]);
};
// A link resolves, and a fragment names a heading on the target page.
const expectTarget = async (page, href) => {
  const url = new URL(href, page.url());
  const response = await page.request.get(url.pathname);
  expect(response.status(), href).toBe(200);
  if (url.hash) expect(await response.text(), href).toContain(`id="${url.hash.slice(1)}"`);
};

test('architecture sums up skills, capabilities and tools, each linking to its list', async ({ page }) => {
  await page.goto('/architecture/');
  const cards = page.locator('.arch-flow').first().locator('.arch-card');
  const capabilities = Object.keys(data.contracts).length + Object.keys(data.substrates).length;
  await expect(cards.locator('.workflow-card-title')).toHaveText([`${data.skills.total} skills`, `${capabilities} capabilities`, `${data.tools.length} tools`]);
  const targets = await cards.evaluateAll(links => links.map(a => a.getAttribute('href')));
  expect(targets).toEqual(['/docs/modes', '/docs/labels-and-capabilities', '/tools']);
  for (const href of targets) await expectTarget(page, href);
  await checkLayout(page);
  await cards.nth(2).click();
  await expect(page).toHaveURL(/\/tools\/?$/);
  await expect(page.locator('.tool-entry')).toHaveCount(data.tools.length);
});

test('vendor neutrality shows the score, the six axes and every contract, linking into the docs', async ({ page }) => {
  await page.goto('/architecture/');
  const section = page.locator('#vendor-neutrality');
  await expect(section.locator('.arch-score')).toContainText(`${neutrality.overall.green} of ${neutrality.overall.total}`);
  await expect(section.locator('.arch-score')).toContainText(`${neutrality.skills.neutral} of ${neutrality.skills.total}`);
  await expect(section.locator('.arch-axes .arch-card')).toHaveCount(6);
  const rows = section.locator('.arch-coverage tbody tr');
  await expect(rows).toHaveCount(neutrality.contracts.length);
  for (const [index, contract] of neutrality.contracts.entries()) {
    const row = rows.nth(index);
    await expect(row.locator('td').first()).toHaveText(contract.contract.replace(/^contract:/, ''));
    for (const vendor of contract.vendors) await expect(row.locator('td').nth(1)).toContainText(vendor);
    await expect(row).toHaveClass(contract.green ? /^$|^(?!.*arch-gap)/ : /arch-gap/);
  }
  for (const href of await section.locator('a').evaluateAll(links => links.map(a => a.getAttribute('href')))) await expectTarget(page, href);
  await checkLayout(page);
});

test('organizations show each profile and link to how to add one', async ({ page }) => {
  await page.goto('/architecture/');
  const section = page.locator('#organizations');
  await expect(section.locator('.arch-org h3')).toHaveText(data.organizations.map(o => o.name));
  // The ASF is its oak leaf, never the feather the organization data links to.
  await expect(section.locator('.arch-org img')).toHaveAttribute('src', '/vendor-logos/oak.svg');
  expect(await page.locator('img[src*="asf_logo"], img[src*="feather"]').count()).toBe(0);
  for (const href of await section.locator('a:not([target=_blank])').evaluateAll(links => links.map(a => a.getAttribute('href')))) await expectTarget(page, href);
  await expect(section.locator('a[target=_blank]')).toHaveAttribute('href', 'https://github.com/apache/magpie/tree/main/organizations');
  for (const width of [375, 1440]) { await page.setViewportSize({ width, height:900 }); await checkLayout(page); }
});

test('resources are cards that each lead to a page that exists', async ({ page }) => {
  for (const width of [375, 800, 1440]) {
    await page.setViewportSize({ width, height:900 });
    await page.goto('/resources/');
    const cards = page.locator('.arch-card');
    await expect(cards).toHaveCount(8);
    await checkLayout(page);
  }
  for (const href of await page.locator('.arch-card').evaluateAll(links => links.map(a => a.getAttribute('href')))) await expectTarget(page, href);
});

test('the agent picker shows the chosen agent and keeps the shared field', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('magpie-theme', 'dark'));
  await page.goto('/start/');
  const picker = page.locator('#start-agent'), logo = page.locator('.agent-select-logo');
  await expect(picker).toBeEnabled();
  await expect(logo).toHaveAttribute('src', '/vendor-logos/claude.png');
  await picker.selectOption('copilot');
  await expect(logo).toHaveAttribute('src', '/vendor-logos/copilot.svg');
  // The dark Copilot mark is lightened on the dark theme, as on the home page.
  expect(await logo.evaluate(img => getComputedStyle(img).filter)).not.toBe('none');
  await expect(page.locator('#install-title')).toContainText('VS Code / GitHub Copilot');
  for (const option of await picker.locator('option').evaluateAll(nodes => nodes.map(n => n.value))) {
    await picker.selectOption(option);
    expect((await page.request.get(await logo.getAttribute('src'))).status()).toBe(200);
  }
  for (const width of [375, 1440]) { await page.setViewportSize({ width, height:900 }); await checkLayout(page); }
});
