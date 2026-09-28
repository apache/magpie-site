import { test, expect } from './fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { measureLayout } from './layout.mjs';
import { measureDesign } from './design.mjs';
import { mkdir } from 'node:fs/promises';

if (!process.env.MAGPIE_TEST_MANIFEST) throw new Error('Use npm run test:browser so tests own a fresh build and server.');
const manifest = JSON.parse(readFileSync(process.env.MAGPIE_TEST_MANIFEST, 'utf8'));
const widths = [320, 375, 600, 800, 801, 1150, 1151, 1440, 1524, 1920];
const checkAccessibility = async page => {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations.map(v => ({ id:v.id, nodes:v.nodes.map(n => ({ target:n.target, summary:n.failureSummary })) }))).toEqual([]);
};
const checkLayout = async page => {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect.poll(() => page.evaluate(measureLayout), { message:'Layout must settle without overflow or misaligned shared components' }).toEqual([]);
  expect(await page.evaluate(measureDesign),'Shared visual rules must hold on every page and state').toEqual([]);
};
for (const { route } of manifest.pages) test('responsive and accessible ' + route, async ({ page }) => {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  const response = await page.goto(route);
  expect(response.headers()['x-magpie-build']).toBe(manifest.token);
  await page.evaluate(() => document.fonts.ready);
  for (const width of widths) {
    await page.setViewportSize({ width, height:900 });
    await checkLayout(page);
  }
  // Both themes and narrow/desktop structures on every generated HTML route.
  for (const width of [375, 1280]) for (const theme of ['light','dark']) {
    await page.setViewportSize({ width, height:900 });
    await page.evaluate(theme => localStorage.setItem('magpie-theme',theme), theme);
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    await checkLayout(page);
    await checkAccessibility(page);
  }
  expect(failures).toEqual([]);
});

test('all carousel and tab states, keyboard, long copy and text zoom', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 800, 801, 1280, 1920]) {
    await page.setViewportSize({ width, height:1000 });
    const checkColumns = async (panel,baseline) => {
      const offsets = await panel.locator('.workflow-checklist > li:first-child > svg').evaluateAll(icons => icons.map(icon => icon.getBoundingClientRect().left-icon.closest('.workflow-card').getBoundingClientRect().left));
      expect(offsets.length).toBeGreaterThan(0);
      if (baseline.length) {
        expect(offsets).toHaveLength(baseline.length);
        offsets.forEach((offset,i) => expect(Math.abs(offset-baseline[i]),'Checklist markers must keep their column between stages').toBeLessThan(1));
      }
      else baseline.push(...offsets);
    };
    const heroColumns = [];
    for (const dot of await page.locator('.reel-dot').all()) {
      await dot.click(); await expect(dot).toHaveAttribute('aria-pressed','true'); await checkLayout(page);
      await checkColumns(page.locator('.reel-slide:not([inert])'),heroColumns);
    }
    for (const name of ['Software lifecycle phases','Security lifecycle phases']) {
      const tabs = page.getByRole('tablist', { name }).getByRole('tab');
      const columns = [];
      const states = await tabs.all();
      for (const tab of states) {
        await tab.click(); await expect(tab).toHaveAttribute('aria-selected','true'); await checkLayout(page);
        const panel = page.locator('#'+await tab.getAttribute('aria-controls'));
        await checkColumns(panel,columns);
        if (name === 'Software lifecycle phases') await expect(panel.locator('.workflow-card > .card-badge > svg')).toHaveCount(3);
      }
      await tabs.last().press('Home'); await expect(tabs.first()).toBeFocused();
      await tabs.first().press('ArrowRight'); await expect(tabs.nth(1)).toBeFocused();
      await tabs.nth(1).press('End'); await expect(tabs.last()).toBeFocused();
    }
  }
  await expect(page.locator('.reel-window')).toHaveAttribute('aria-live','polite');
  await page.setViewportSize({ width:1280, height:1000 });
  await page.evaluate(() => {
    document.querySelector('.reel-slide:not([inert]) .centered-label-text').textContent = 'A very long maintenance task with unbreakable identifiers: VeryLongProjectAndMaintenanceWorkflowIdentifier';
    const list = document.querySelector('.reel-slide:not([inert]) .workflow-checklist');
    list.append(list.firstElementChild.cloneNode(true));
    document.documentElement.style.fontSize = '200%';
  });
  await checkLayout(page);
  await page.setViewportSize({ width:320, height:900 });
  await checkLayout(page);
});

test('tools search, all filter dimensions, empty result and reset', async ({ page }) => {
  await page.goto('/tools/');
  const cards = page.locator('.tool-entry:visible'), total = await cards.count();
  await page.getByRole('searchbox', { name:'Search tools' }).fill('no-such-tool-zzzzz');
  await expect(cards).toHaveCount(0); await expect(page.locator('#tool-empty')).toBeVisible();
  await checkAccessibility(page);
  await page.getByRole('button', { name:'Clear filters' }).click();
  await expect(cards).toHaveCount(total); await expect(page.locator('#tool-query')).toBeFocused();
  await page.getByText('More filters', { exact:true }).click();
  for (const id of ['tool-capability','tool-vendor','tool-org']) {
    const select = page.locator('#' + id), options = await select.locator('option').evaluateAll(nodes => nodes.map(n => n.value).filter(Boolean));
    for (const value of options) { await select.selectOption(value); await expect(cards).not.toHaveCount(0); await checkLayout(page); }
    await select.selectOption('');
  }
  await page.locator('#tool-mcp').check(); expect(await cards.count()).toBeLessThan(total);
  await page.getByRole('button', { name:'Clear filters' }).click(); await expect(cards).toHaveCount(total);
});

test('documentation search, no results, retry, focus and mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width:320, height:900 });
  await page.goto('/docs/');
  const browse = page.getByRole('button', { name:'Browse documentation' });
  await browse.click(); await expect(browse).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('.docs-main')).toHaveAttribute('inert','');
  await checkAccessibility(page);
  await page.keyboard.press('Escape'); await expect(browse).toBeFocused();
  const search = page.getByRole('button', { name:/Search docs/ });
  await search.click(); await expect(page.getByRole('dialog')).toBeVisible();
  await checkAccessibility(page);
  await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('dialog').locator(':focus')).toHaveCount(1);
  await page.getByRole('searchbox').focus();
  await page.getByRole('searchbox').fill('zzzz-nothing-here');
  await expect(page.locator('.search-status')).toContainText('No pages found');
  await page.getByRole('searchbox').fill('security');
  await expect(page.locator('.search-results a')).not.toHaveCount(0);
  await page.getByRole('searchbox').press('ArrowDown');
  await expect(page.locator('.search-results a').first()).toBeFocused();
  await page.keyboard.press('Escape'); await expect(search).toBeFocused();
  await page.reload();
  await page.route('**/search-index.json', route => route.fulfill({ status:503, body:'Unavailable' }));
  await search.click(); await expect(page.locator('.search-status')).toContainText('temporarily unavailable');
  await page.keyboard.press('Escape'); await page.unroute('**/search-index.json');
  await search.click(); await expect(page.locator('.search-results a')).not.toHaveCount(0);
});

test('installation variants, clipboard and persistent theme', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/start/');
  const select = page.getByLabel('Which agent do you use?');
  await expect(select).toBeEnabled();
  for (const value of await select.locator('option').evaluateAll(nodes => nodes.map(n => n.value))) {
    await select.selectOption(value);
    await page.getByRole('button', { name:'Copy installation commands' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe((await page.locator('.install-code code').textContent()).trim());
    await checkLayout(page);
  }
  await page.getByRole('button', { name:'Switch to dark mode' }).click(); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});

test('charts: all metrics, periods, data table and keyboard', async ({ page }) => {
  await page.goto('/stories/airflow/');
  const metric = page.getByLabel('Chart metric');
  for (const value of await metric.locator('option').evaluateAll(nodes => nodes.map(n => n.value))) for (const period of ['Monthly','Quarterly']) {
    await metric.selectOption(value); await page.getByRole('button', { name:period, exact:true }).click();
    await page.locator('.airflow-chart').press('Home');
    await expect(page.locator('.chart-readout strong')).toBeVisible();
    await checkLayout(page);
  }
  await page.getByText('View data table', { exact:true }).click(); await expect(page.locator('.chart-data table')).toBeVisible();
});

test('terminal simulation: decisions, form, busy state and restart', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name:'security', exact:true }).click();
  for (let step = 0; step < 4; step++) {
    await page.getByRole('button', { name:'details', exact:true }).click();
    await page.getByRole('button', { name:'reject', exact:true }).click();
    await expect(page.getByRole('log')).toContainText('kept as a draft');
    await page.getByRole('button', { name:'approve', exact:true }).click();
    if (step < 3) await page.getByRole('button', { name:'next', exact:true }).click();
  }
  await expect(page.getByRole('log')).toContainText('walkthrough complete');
  await page.getByRole('button', { name:'Restart demo' }).click();
  await page.getByRole('textbox', { name:'Command or request' }).fill('triage PRs');
  await page.getByRole('textbox', { name:'Command or request' }).press('Enter');
  await expect(page.getByRole('textbox')).toBeDisabled();
  await expect(page.getByRole('button', { name:'approve', exact:true })).toBeEnabled();
  await page.getByRole('button', { name:'approve', exact:true }).click();
  await expect(page.getByRole('log')).toContainText('Simulated approval recorded');
});

test('keyboard skip link, visible focus and visual review artifacts', async ({ page }) => {
  await mkdir('.builds/visual',{recursive:true});
  for (const width of [375,1440]) for (const theme of ['light','dark']) for (const route of ['/','/docs/','/docs/security/readme/','/start/','/tools/','/architecture/','/resources/','/downloads/','/brand/','/stories/airflow/','/demo/','/404']) {
    await page.setViewportSize({width,height:1000}); await page.goto(route);
    await page.evaluate(theme => localStorage.setItem('magpie-theme',theme),theme); await page.reload();
    await page.evaluate(() => document.fonts.ready); await checkLayout(page);
    await page.screenshot({path:`.builds/visual/${route.replaceAll('/','-') || 'home'}-${width}-${theme}.png`});
  }
  await page.goto('/'); await page.keyboard.press('Tab');
  const skip = page.getByRole('link',{name:'Skip to content'});
  await expect(skip).toBeFocused();
  expect(await skip.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('shared control hover, keyboard focus and disabled presentation across page families', async ({page}) => {
  for (const route of ['/','/start/','/docs/security/readme/','/stories/airflow/','/demo/']) {
    await page.goto(route);
    const buttons = page.locator('main .button:visible');
    expect(await buttons.count()).toBeGreaterThan(0);
    for (const button of await buttons.all()) {
      await button.hover();
      await checkLayout(page);
      if (await button.isEnabled()) {
        await button.focus();
        expect(await button.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
        expect(await button.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);
      } else {
        expect(await button.evaluate(el => getComputedStyle(el).cursor)).toBe('default');
        expect(await button.evaluate(el => getComputedStyle(el).opacity)).toBe('0.5');
      }
    }
  }
});

test('workflow connectors share one icon and breathing room between cards', async ({page}) => {
  await page.goto('/');
  for (const width of [375,1000,1524]) {
    await page.setViewportSize({width,height:1000});
    await page.getByRole('tablist',{name:'Software lifecycle phases',exact:true}).getByRole('tab',{name:'Review',exact:true}).click();
    for (const selector of ['.reel-slide:not([inert]) .reel-flow','.lifecycle-detail .lifecycle-flow','.learning-grid','.card-flow']) {
      for (const flow of await page.locator(selector).all()) {
        await expect(flow.locator('.flow-arrow.lucide-arrow-right')).toHaveCount(await flow.locator(':scope > .workflow-card').count()-1);
      }
    }
    await checkLayout(page);
  }
});

test('homepage growth, protection layers and learning paths', async ({ page }) => {
  await page.goto('/');
  const growth = await page.locator('.airflow-chart-story').evaluate(figure => {
    const sample = selector => {
      const path = figure.querySelector(selector), length = path.getTotalLength();
      return Array.from({length:81}, (_,i) => {
        const {x,y} = path.getPointAtLength(length*i/80); return {x,y};
      });
    };
    return {incoming:sample('.incoming-line'), history:sample('.manual-history'), projected:sample('.without-line')};
  });
  for (const points of Object.values(growth)) for (let i=1;i<points.length;i++) {
    expect(points[i].x).toBeGreaterThan(points[i-1].x);
    expect(points[i-1].y-points[i].y).toBeGreaterThan(.1);
  }
  const slope = (a,b) => (a.y-b.y)/(b.x-a.x);
  expect(slope(growth.history.at(-2),growth.history.at(-1))).toBeCloseTo(slope(growth.projected[0],growth.projected[1]),3);
  await expect(page.locator('.isolation-open .card-badge svg')).toBeVisible();
  for (const phase of await page.locator('.chart-phases > div').all()) await expect(phase.locator(':scope > .card-badge')).toHaveCount(1);
  await expect(page.locator('.isolation-protected .protection-layer')).toHaveCount(4);
  await expect(page.locator('.isolation-protected')).toHaveAttribute('data-card-tone','result');
  await expect(page.locator('.section-followup p')).toHaveCount(0);
  await expect(page.locator('.example-quote')).toHaveCSS('font-style','italic');
  await expect(page.locator('.example-quote')).not.toContainText(/[“”]/);
  await expect(page.locator('.protection-layer .protection-layer .protection-layer .protection-layer .protected-workspace')).toBeVisible();
  await expect(page.locator('.learning-grid a')).toHaveCount(3);
  expect(await page.locator('.learning-grid .workflow-card').evaluateAll(cards => cards.map(card => card.dataset.cardTone))).toEqual(['manual','prepared','result']);
  for (const flow of await page.locator('.reel-flow,.lifecycle-flow').all()) {
    expect(await flow.locator(':scope > .workflow-card').evaluateAll(cards => cards.map(card => card.dataset.cardTone))).toEqual(['manual','prepared','result']);
  }
  for (const card of await page.locator('.isolation-side').all()) await expect(card.locator('.workflow-card-body > :first-child')).toHaveClass('agent-diagram');
  await expect(page.locator('.project-fit .workflow-card > .card-badge > svg')).toHaveCount(2);
  await expect(page.locator('.case-layout .security-walkthrough')).toHaveCount(1);
  const articleOrder = await page.locator('.case-layout').evaluate(el => [...el.children].map(child => child.className));
  expect(articleOrder).toEqual(['case-intro','case-evidence','case-quote','case-walkthrough']);
  await expect(page.locator('#airflow > .container > h2')).toHaveCount(1);
  await expect(page.locator('#airflow')).toHaveAccessibleName('Success stories');
  await expect(page.locator('.case-intro h3')).toHaveText('Magpie helped Airflow keep up with security reports');
  await expect(page.locator('.case-quote :is(h2,h3,a)')).toHaveCount(0);
  const portrait = page.locator('.case-quote .quote-person img');
  await portrait.scrollIntoViewIfNeeded();
  await expect(portrait).toBeVisible();
  await expect.poll(() => portrait.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  const dataLink = page.locator('.airflow-chart-story .chart-note a');
  await expect(dataLink).toHaveAttribute('href','/stories/airflow');
  await expect(dataLink.locator('.cta-arrow')).toHaveCount(1);
  await mkdir('.builds/visual',{recursive:true});
  for (const width of [375,1440,1524]) for (const theme of ['light','dark']) {
    await page.setViewportSize({width,height:1000});
    await page.evaluate(theme => localStorage.setItem('magpie-theme',theme),theme); await page.reload();
    await page.evaluate(() => document.fonts.ready); await checkLayout(page);
    const successColor = await page.locator('.learning-grid [data-card-tone=result]').evaluate(el => getComputedStyle(el).backgroundColor);
    const storyBand = await page.locator('#airflow').evaluate(el => {
      const probe = document.createElement('span');
      probe.style.color = 'color-mix(in srgb,var(--result-bg) 18%,var(--paper))';
      el.append(probe); const color = getComputedStyle(probe).color; probe.remove(); return color;
    });
    await expect(page.locator('#airflow')).toHaveCSS('background-color',storyBand);
    await expect(page.locator('.isolation-protected')).toHaveCSS('background-color',successColor);
    const successAccent = await page.locator('.layer-label svg').first().evaluate(el => getComputedStyle(el).color);
    await expect(page.locator('.time-line')).toHaveCSS('stroke',successAccent);
    await expect(page.locator('.saved-time-area')).toHaveCSS('fill',successAccent);
    await expect(page.locator('.saved-time-label')).toHaveCSS('fill',successAccent);
    for (const mark of await page.locator('.magpie-toolkit:visible > use').all()) {
      await expect(mark).toHaveCSS('fill',await mark.evaluate(el => getComputedStyle(el.parentElement).color));
      await expect(mark).toHaveCSS('stroke','none');
    }
    await expect(page.locator('.case-layout')).toHaveAccessibleName('Magpie helped Airflow keep up with security reports');
    const storyHeadingStyle = await page.locator('.security-walkthrough .lifecycle-heading h3').evaluate(el => {
      const style = getComputedStyle(el);
      return Object.fromEntries(['font-family','font-size','font-weight','line-height','letter-spacing'].map(property => [property,style.getPropertyValue(property)]));
    });
    for (const [property,value] of Object.entries(storyHeadingStyle)) await expect(page.locator('.case-intro h3')).toHaveCSS(property,value);
    for (const [name,selector] of [['hero','.hero'],['airflow','#airflow'],['story','.story-comparison'],['isolation','.isolation-comparison'],['project','.project-fit'],['learning','.learn-skills']]) {
      // Hide only fixed chrome while capturing a tall section: otherwise the
      // header is composited across its middle. Geometry checks run unmodified.
      await page.locator(selector).first().screenshot({path:`.builds/visual/home-${name}-${width}-${theme}.png`,style:'.site-header, .site-header *, .skip-link { visibility:hidden; }'});
    }
    for (const [index,name] of [[1,'review'],[4,'contributor'],[5,'dependencies']]) {
      await page.locator('.reel-dot').nth(index).click();
      await checkLayout(page);
      await page.locator('.hero').screenshot({path:`.builds/visual/home-hero-${name}-${width}-${theme}.png`,style:'.site-header, .site-header *, .skip-link { visibility:hidden; }'});
    }
    for (const name of ['Review','Grow']) {
      await page.getByRole('tablist',{name:'Software lifecycle phases',exact:true}).getByRole('tab',{name,exact:true}).click();
      await checkLayout(page);
      await page.locator('.choose-work').screenshot({path:`.builds/visual/home-lifecycle-${name.toLowerCase()}-${width}-${theme}.png`,style:'.site-header, .site-header *, .skip-link { visibility:hidden; }'});
    }
    for (const tab of await page.getByRole('tablist',{name:'Security lifecycle phases'}).getByRole('tab').all()) {
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected','true');
      await checkLayout(page);
      const stage = (await tab.textContent()).trim().toLowerCase();
      await page.locator('.security-scene[aria-hidden=false]').screenshot({path:`.builds/visual/home-story-${stage}-${width}-${theme}.png`,style:'.site-header, .site-header *, .skip-link { visibility:hidden; }'});
    }
  }
});
