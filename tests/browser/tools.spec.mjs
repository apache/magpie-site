import { test, expect } from './fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { measureLayout } from './layout.mjs';
import { measureDesign } from './design.mjs';

if (!process.env.MAGPIE_TEST_MANIFEST) throw new Error('Use npm run test:browser so tests own a fresh build and server.');
// The page and these checks read the same generated data, so the tests follow
// the tool list rather than pinning today's counts.
const data = JSON.parse(readFileSync('src/data/tools.json', 'utf8'));
const tools = [...data.tools].sort((a, b) => a.name.localeCompare(b.name));
const implementation = t => t.vendorKind === 'implementation' && t.vendor && t.vendor !== 'agnostic';

const checkLayout = async page => {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect.poll(() => page.evaluate(measureLayout)).toEqual([]);
  expect(await page.evaluate(measureDesign)).toEqual([]);
};
const checkAccessibility = async page => {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations.map(v => ({ id:v.id, nodes:v.nodes.map(n => n.target) }))).toEqual([]);
};
const menu = (page, dim) => page.locator(`details.filter-menu[data-dim=${dim}]`);

test('tools search, every filter option, multiple choices, chips, empty result and reset', async ({ page }) => {
  await page.goto('/tools/');
  const cards = page.locator('.tool-entry:visible'), total = await cards.count();
  await page.getByRole('searchbox', { name:'Search tools' }).fill('no-such-tool-zzzzz');
  await expect(cards).toHaveCount(0); await expect(page.locator('#tool-empty')).toBeVisible();
  await checkAccessibility(page);
  await page.getByRole('button', { name:'Clear filters' }).click();
  await expect(cards).toHaveCount(total); await expect(page.locator('#tool-query')).toBeFocused();
  // Every option shows exactly the tools its count promises.
  for (const dim of await page.locator('details.filter-menu').all()) {
    await dim.locator('summary').click(); await expect(dim).toHaveAttribute('open','');
    await checkLayout(page);
    for (const option of await dim.locator('.filter-option').all()) {
      const expected = Number(await option.locator('.filter-option-count').innerText());
      await option.locator('input').check(); await expect(cards).toHaveCount(expected);
      await option.locator('input').uncheck();
    }
    await page.keyboard.press('Escape'); await expect(dim).not.toHaveAttribute('open');
  }
  // Choices within a dimension widen the result; dimensions narrow it.
  const vendor = menu(page, 'vendor');
  await vendor.locator('summary').click();
  await vendor.locator('input[value=GitHub]').check(); const github = await cards.count();
  await vendor.locator('input[value=Atlassian]').check(); const both = await cards.count();
  expect(both).toBeGreaterThan(github);
  await expect(vendor.locator('[data-badge]')).toHaveText('2');
  await page.keyboard.press('Escape');
  await page.locator('#tool-mcp').click(); await expect(page.locator('#tool-mcp')).toHaveAttribute('aria-pressed','true');
  expect(await cards.count()).toBeLessThanOrEqual(both);
  await page.getByRole('button', { name:'Remove filter GitHub' }).click();
  await expect(vendor.locator('input[value=GitHub]')).not.toBeChecked();
  await checkLayout(page);
  await page.getByRole('button', { name:'Clear filters' }).click(); await expect(cards).toHaveCount(total);
  await expect(page.locator('.tool-chip')).toHaveCount(0);
});

test('the result follows the filter semantics exactly', async ({ page }) => {
  await page.goto('/tools/');
  const shown = () => page.locator('.tool-entry:visible h2').allInnerTexts();
  const titles = list => list.map(t => t.title);
  // Two contracts: any of them.
  const [first, second] = Object.keys(data.contracts);
  await menu(page, 'contract').locator('summary').click();
  await menu(page, 'contract').locator(`input[value="contract:${first}"]`).check();
  await menu(page, 'contract').locator(`input[value="contract:${second}"]`).check();
  const hasContract = t => t.labels.some(l => l.kind === 'contract' && [first, second].includes(l.name));
  expect(await shown()).toEqual(titles(tools.filter(hasContract)));
  // Plus a vendor: every dimension together.
  await menu(page, 'vendor').locator('summary').click();
  await menu(page, 'vendor').locator('input[value=GitHub]').check();
  expect(await shown()).toEqual(titles(tools.filter(t => hasContract(t) && implementation(t) && t.vendor === 'GitHub')));
  await page.getByRole('button', { name:'Clear filters' }).click();
  // Search matches words in any order, across title, summary and capabilities.
  await page.getByRole('searchbox', { name:'Search tools' }).fill('GITHUB   issues');
  expect((await shown()).length).toBeGreaterThan(0);
  for (const title of await shown()) expect(tools.find(t => t.title === title)).toBeTruthy();
  // Interface specifications and organization-agnostic tools are filters too.
  await page.getByRole('button', { name:'Clear filters' }).click();
  await menu(page, 'vendor').locator('summary').click();
  await menu(page, 'vendor').locator('input[value=__interface]').check();
  expect(await shown()).toEqual(titles(tools.filter(t => t.vendorKind === 'interface')));
  await page.getByRole('button', { name:'Clear filters' }).click();
  await menu(page, 'org').locator('summary').click();
  await menu(page, 'org').locator('input[value=__agnostic]').check();
  expect(await shown()).toEqual(titles(tools.filter(t => !t.organization)));
  // The chosen capability's meaning is shown.
  await page.getByRole('button', { name:'Clear filters' }).click();
  await menu(page, 'contract').locator('summary').click();
  await menu(page, 'contract').locator(`input[value="contract:${first}"]`).check();
  await expect(page.locator('#tool-defs')).toContainText(data.contracts[first]);
});

test('tool cards carry the details of each tool', async ({ page }) => {
  await page.goto('/tools/');
  await expect(page.locator('.tool-entry')).toHaveCount(tools.length);
  for (const [index, tool] of tools.entries()) {
    const card = page.locator('.tool-entry').nth(index);
    await expect(card.locator('h2')).toHaveText(tool.title);
    await expect(card).toHaveAttribute('href', `/docs/tools/${tool.name}/readme`);
    await expect(card.locator('.tool-cap')).toHaveText(tool.labels.map(l => l.name));
    const tags = card.locator('.tool-tag');
    if (implementation(tool)) await expect(tags.filter({ hasText: tool.vendor })).toHaveCount(1);
    // The organization gets its own tag only when it is not already the vendor.
    if (tool.organization && tool.organization !== tool.vendor) await expect(tags.filter({ hasText: tool.organization })).toHaveCount(1);
    await expect(tags.filter({ hasText:/^MCP$/ })).toHaveCount(tool.mcp ? 1 : 0);
    await expect(tags.filter({ hasText:/^Interface$/ })).toHaveCount(tool.vendorKind === 'interface' ? 1 : 0);
    await expect(tags.filter({ hasText: tool.hasCode ? 'Implemented' : 'Adapter / spec' })).toHaveCount(1);
  }
  // Vendor marks are the bundled logos; the ASF is its oak leaf, never the feather.
  const logos = await page.locator('img.filter-logo').evaluateAll(imgs => imgs.map(i => i.getAttribute('src')));
  expect(logos.length).toBeGreaterThan(0);
  for (const src of logos) expect(src).toMatch(/^\/vendor-logos\/[a-z]+\.svg$/);
  expect(await page.locator('img[src*="asf_logo"], img[src*="feather"]').count()).toBe(0);
  for (const src of new Set(logos)) expect((await page.request.get(src)).status()).toBe(200);
  // The summary numbers are the data's.
  await expect(page.locator('.tool-stats')).toContainText(`${data.tools.length} tools`);
  await expect(page.locator('.tool-stats')).toContainText(`${data.mcpTotal} wrap an MCP server`);
});

test('filter menus work with the keyboard, and one is open at a time', async ({ page }) => {
  await page.goto('/tools/');
  const contract = menu(page, 'contract'), vendor = menu(page, 'vendor');
  await contract.locator('summary').focus(); await page.keyboard.press('Enter');
  await expect(contract).toHaveAttribute('open','');
  await page.keyboard.press('Tab'); await expect(contract.locator('input').first()).toBeFocused();
  await page.keyboard.press('Space'); await expect(contract.locator('input').first()).toBeChecked();
  await expect(contract.locator('[data-badge]')).toHaveText('1');
  await page.keyboard.press('Escape');
  await expect(contract).not.toHaveAttribute('open'); await expect(contract.locator('summary')).toBeFocused();
  await contract.locator('summary').click(); await vendor.locator('summary').click();
  await expect(vendor).toHaveAttribute('open',''); await expect(contract).not.toHaveAttribute('open');
  await page.locator('h1').click(); await expect(vendor).not.toHaveAttribute('open');
});

for (const theme of ['light','dark']) test(`tools filters stay in reach and fit a phone in ${theme}`, async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem('magpie-theme', value), theme);
  // Desktop: the filter bar stays pinned under the header while the grid scrolls.
  await page.setViewportSize({ width:1440, height:900 });
  await page.goto('/tools/');
  await page.mouse.wheel(0, 2500);
  await expect.poll(() => page.locator('#tool-filters').evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(
    await page.locator('.site-header').evaluate(el => Math.round(el.getBoundingClientRect().height)));
  await checkLayout(page);
  // Phone: the controls wrap instead of overflowing, and an open menu stays on screen.
  await page.setViewportSize({ width:375, height:800 });
  await page.goto('/tools/');
  for (const control of await page.locator('.tool-filter-row > :not([hidden])').all()) {
    const box = await control.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(375);
  }
  await menu(page, 'vendor').locator('summary').click();
  const panel = await menu(page, 'vendor').locator('.filter-panel').boundingBox();
  expect(panel.x).toBeGreaterThanOrEqual(0); expect(panel.x + panel.width).toBeLessThanOrEqual(375);
  await checkLayout(page);
  await checkAccessibility(page);
});

test('every page offers the home page sections', async ({ page }) => {
  for (const route of ['/tools/', '/architecture/', '/start/']) {
    await page.goto(route);
    const sections = page.locator('.home-navigation');
    await sections.locator('summary').click(); await expect(sections).toHaveAttribute('open','');
    const links = sections.locator('nav a[href^="/#"]');
    await expect(links).toHaveCount(7);
    await page.keyboard.press('Escape'); await expect(sections).not.toHaveAttribute('open');
  }
  await page.goto('/tools/');
  await page.locator('.home-navigation summary').click();
  await page.locator('.home-navigation').getByRole('link', { name:'Agent isolation', exact:true }).click();
  await expect(page).toHaveURL(/\/#agent-isolation$/);
  await expect(page.locator('#agent-isolation')).toBeInViewport();
});
