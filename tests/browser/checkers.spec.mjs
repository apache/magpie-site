import { test, expect } from '@playwright/test';
import { measureLayout } from './layout.mjs';
import { measureDesign } from './design.mjs';
import { readFileSync } from 'node:fs';

test('diagram connectors stay on the icon row when captions wrap', async ({page}) => {
  await page.setContent('<div style="max-width:320px" aria-hidden="true"><div class="illustration-pair"><div><svg width="30" height="30"></svg><span>Code</span></div><svg width="20" height="20"></svg><div><svg width="30" height="30"></svg><span>A longer result label that wraps</span></div></div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const width of [320,1280]) for (const zoom of ['100%','200%']) {
    await page.setViewportSize({width,height:900});
    await page.evaluate(zoom => document.documentElement.style.fontSize = zoom,zoom);
    expect(await page.evaluate(measureLayout)).toEqual([]);
  }
  await page.locator('.illustration-pair > svg').evaluate(el => el.style.transform = 'translateY(20px)');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('diagram connector is not aligned with icons');
});

test('isolation diagrams share the prose column at every width', async ({page}) => {
  await page.setContent('<div class="isolation-sides"><div class="surface-card workflow-card isolation-side"><h3 class="workflow-card-heading">Access</h3><div class="workflow-card-body"><div class="agent-diagram">Agent and boundaries</div><p>The agent works inside the allowed workspace.</p></div></div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/components/landing/workflow-card.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const width of [320,800,1524]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(measureLayout)).toEqual([]);
    await page.locator('.agent-diagram').evaluate(el => el.style.width = 'calc(100% + 24px)');
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('isolation diagram and prose need one content column');
    await page.locator('.agent-diagram').evaluate(el => el.removeAttribute('style'));
  }
});

test('workflow surfaces fit their content instead of the tallest hidden slide', async ({page}) => {
  const card = text => `<div class="surface-card workflow-card"><h3 class="workflow-card-heading"><span class="centered-label"><span class="centered-label-text">A workflow</span></span></h3><div class="workflow-card-body"><p>${text}</p></div></div>`;
  await page.setContent(`<div style="display:grid"><div style="grid-area:1/1"><div class="lifecycle-flow">${card('One short explanation.')}${card('A longer explanation. '.repeat(8))}${card('A useful result.')}</div></div><div style="grid-area:1/1" aria-hidden="true" inert><div style="height:900px">A taller inactive stage</div></div></div>`);
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/components/landing/workflow-card.css','src/components/landing/centered-label.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  // A short card must not inherit unused body height from its neighbour or
  // from the stable outer viewport. This is independent of exact copy/height.
  const measure = () => page.locator('.workflow-card').first().evaluate(card => {
    const body = card.querySelector('.workflow-card-body');
    return body.getBoundingClientRect().height - body.firstElementChild.getBoundingClientRect().height;
  });
  expect(await measure()).toBeLessThanOrEqual(2);
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('.workflow-card-body').first().evaluate(el => el.style.minHeight = '400px');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('card body stretched beyond content');
  await page.locator('.workflow-card-body').first().evaluate(el => el.removeAttribute('style'));
  await page.locator('.lifecycle-flow').evaluate(el => el.style.alignItems = 'stretch');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('card body stretched beyond content');
  await page.locator('.lifecycle-flow').evaluate(el => el.removeAttribute('style'));
  await page.locator('.workflow-card').first().evaluate(el => el.style.alignSelf = 'start');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('unaligned flow card centers');
  await page.locator('.workflow-card').first().evaluate(el => el.removeAttribute('style'));
  await page.setViewportSize({width:320,height:900});
  expect(await measure()).toBeLessThanOrEqual(2);
  expect(await page.evaluate(measureLayout)).toEqual([]);
});

test('flow connectors share their icon, position and clearance at every width', async ({page}) => {
  const card = connector => `<div class="surface-card workflow-card"><h3 class="workflow-card-heading"><span class="card-badge" aria-hidden="true">◇</span><span class="workflow-card-title">A step</span></h3><div class="workflow-card-body">Work</div>${connector ? '<svg class="lucide lucide-arrow-right flow-arrow" aria-hidden="true" viewBox="0 0 24 24"></svg>' : ''}</div>`;
  await page.setContent(`<div class="lifecycle-flow">${card(true)}${card(true)}${card(false)}</div>`);
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/components/landing/workflow-card.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const width of [375,1000,1524]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(measureLayout)).toEqual([]);
    const arrow = page.locator('.flow-arrow').first();
    await arrow.evaluate(el => el.style.width = '20px');
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('inconsistent flow connector icon');
    await arrow.evaluate(el => { el.removeAttribute('style'); el.style.translate = '12px 12px'; });
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('inconsistent flow connector clearance');
    await arrow.evaluate(el => el.removeAttribute('style'));
    await page.locator('.lifecycle-flow').evaluate(el => el.style.gap = '32px');
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('inconsistent flow connector clearance');
    await page.locator('.lifecycle-flow').evaluate(el => el.removeAttribute('style'));
  }
});

test('section follow-ups center their shared soft CTA', async ({page}) => {
  await page.setContent('<div class="section-followup"><a class="button button-soft" href="#">Explore</a></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const width of [375,1524]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(measureLayout)).toEqual([]);
    await page.locator('a').evaluate(el => el.style.alignSelf = 'flex-end');
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('off-center section follow-up');
    await page.locator('a').evaluate(el => { el.removeAttribute('style'); el.classList.remove('button-soft'); });
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('section follow-up missing shared CTA');
    await page.locator('a').evaluate(el => el.classList.add('button-soft'));
  }
});

test('sequence controls use round surfaces and chevrons distinct from diagram arrows', async ({page}) => {
  await page.setContent('<div class="sequence-navigation"><div class="sequence-body"><button class="button button-soft button-icon button-round" aria-label="Previous"><svg class="lucide lucide-chevron-left"></svg></button><div class="sequence-content"></div><button class="button button-soft button-icon button-round" aria-label="Next"><svg class="lucide lucide-chevron-right"></svg></button></div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/styles/feedback.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  await page.mouse.move(500,500);
  for (const theme of ['light','dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme,theme);
    expect(await page.evaluate(measureDesign)).toEqual([]);
    const control = page.locator('button').first();
    await control.evaluate(el => el.style.background = 'transparent');
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('sequence control missing subtle background');
    await control.evaluate(el => {el.removeAttribute('style'); el.classList.remove('button-round');});
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('inconsistent sequence navigation control');
    await control.evaluate(el => el.classList.add('button-round'));
    await control.locator('svg').evaluate(el => el.classList.replace('lucide-chevron-left','lucide-arrow-right'));
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('inconsistent sequence navigation control');
    await control.locator('svg').evaluate(el => el.classList.replace('lucide-arrow-right','lucide-chevron-left'));
  }
});

test('sequence controls sit beside the card row and fall below stacked cards', async ({page}) => {
  await page.setContent('<div class="workflow-sequence"><div class="sequence-navigation"><div class="sequence-body"><button class="button button-soft button-icon button-round" aria-label="Previous">‹</button><div class="sequence-content"><div class="lifecycle-flow"><div class="surface-card workflow-card"><h3 class="workflow-card-heading">A task</h3><div class="workflow-card-body">Prepared work</div></div></div></div><button class="button button-soft button-icon button-round" aria-label="Next">›</button></div></div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/components/landing/workflow-card.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  await page.setViewportSize({width:1524,height:900});
  expect(await page.evaluate(measureLayout)).toEqual([]);
  const previous = page.locator('button').first();
  await previous.evaluate(el => el.style.transform = 'translateY(140px)');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('sequence controls are not level with cards');
  await previous.evaluate(el => el.removeAttribute('style'));
  await page.setViewportSize({width:375,height:900});
  expect(await page.evaluate(measureLayout)).toEqual([]);
  const contentBottom = await page.locator('.sequence-content').evaluate(el => el.getBoundingClientRect().bottom);
  for (const button of await page.locator('button').all()) expect(await button.evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(contentBottom);
});

test('case-study testimonial keeps two text sizes across its quote and attribution', async ({page}) => {
  await page.setContent('<main class="redesign-home"><article class="case-layout"><div class="case-quote"><blockquote>A maintainer’s experience.</blockquote><div class="quote-person"><div><strong>Name</strong><span>Project maintainer</span></div></div></div><div class="lifecycle-heading"><h3>Why did Magpie help so much?</h3><p>Skills cover the whole process.</p></div></article></main>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureDesign)).toEqual([]);
  await page.locator('.quote-person strong').evaluate(el => el.style.fontSize = '24px');
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('more than two card text sizes: case-quote');
  await page.locator('.quote-person strong').evaluate(el => el.removeAttribute('style'));
  expect(await page.evaluate(measureDesign)).toEqual([]);
});

test('card reading measure and surface elevation are shared in both themes', async ({page}) => {
  await page.setContent('<div class="card-flow"><div class="surface-card workflow-card"><h3>Heading</h3><div class="workflow-card-body"><p>A short paragraph.</p></div></div></div><div class="chart-frame">Chart</div><table class="reference-table"><tbody><tr><td>Data</td></tr></tbody></table><div class="tool-entry">A plain list row</div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/styles/feedback.css','src/components/landing/workflow-card.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const theme of ['light','dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme,theme);
    await expect(page.locator('.tool-entry')).toHaveCSS('box-shadow','none');
    expect(await page.evaluate(measureDesign)).toEqual([]);
    await page.locator('p').evaluate(el => el.style.maxWidth = 'none');
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('overwide card prose');
    await page.locator('p').evaluate(el => el.removeAttribute('style'));
    await page.locator('p').evaluate(el => el.style.marginInline = '0');
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('off-center card prose column');
    await page.locator('p').evaluate(el => el.removeAttribute('style'));
    await page.locator('.workflow-card').evaluate(el => { el.style.width = '600px'; el.style.maxWidth = 'none'; });
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('overwide workflow card');
    await page.locator('.workflow-card').evaluate(el => el.removeAttribute('style'));
    for (const selector of ['.surface-card','.chart-frame','.reference-table']) {
      await page.locator(selector).evaluate(el => el.style.boxShadow = 'none');
      expect((await page.evaluate(measureDesign)).join('\n')).toContain('inconsistent surface shadow');
      await page.locator(selector).evaluate(el => el.removeAttribute('style'));
    }
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    expect(await page.evaluate(measureDesign)).toEqual([]);
    await page.evaluate(() => document.documentElement.style.fontSize = '');
  }
});

test('design checker rejects local button, field, card and title overrides', async ({page}) => {
  await page.setContent('<h1>A page title</h1><a class="button" href="#">Start <svg class="lucide lucide-arrow-right cta-arrow"></svg></a><button class="button button-secondary button-small">Copy</button><select class="field-control"><option>Choose</option></select><div class="surface-card"><h2>Card title</h2><p>Card text</p></div><div role="tablist" class="workflow-stages"><button role="tab"><span class="workflow-stage-point">1</span>First</button></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  await expect.poll(() => page.evaluate(measureDesign)).toEqual([]);
  for (const [selector,property,value,message] of [
    ['.button','fontSize','20px','button typography'], ['.button','fontFamily','monospace','button font family'], ['.button','borderRadius','3px','button shape'],
    ['.button','paddingLeft','37px','button spacing'], ['.button','textDecoration','underline','button underline'],
    ['.button','minHeight','20px','button target'], ['select','minHeight','30px','field target'],
    ['select','borderRadius','5px','field shape'], ['select','fontSize','12px','field typography'],
    ['.surface-card','borderRadius','5px','card shape'], ['.surface-card','paddingTop','37px','card padding'],
    ['.surface-card','border','1px solid red','card border'],
    ['h2','fontSize','27px','card typography'], ['p','fontSize','18px','card body typography'],
    ['h1','fontSize','70px','page title typography'], ['.workflow-stage-point','width','50px','stage marker'],
  ]) {
    const element = page.locator(selector).first();
    await element.evaluate((el,{property,value}) => el.style[property] = value,{property,value});
    await expect.poll(async () => (await page.evaluate(measureDesign)).join('\n')).toContain(message);
    await element.evaluate(el => el.removeAttribute('style'));
    await expect.poll(() => page.evaluate(measureDesign)).toEqual([]);
  }
  await page.locator('select').evaluate(el => el.className = '');
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('field missing shared control');
});

test('content cards use only the shared title and reading sizes', async ({page}) => {
  await page.setContent('<div class="surface-card"><h3>Title</h3><p>Body <strong>emphasis</strong></p><a href="#">Action</a></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureDesign)).toEqual([]);
  await page.locator('strong').evaluate(el => el.style.fontSize = '26px');
  const errors = (await page.evaluate(measureDesign)).join('\n');
  expect(errors).toContain('more than two card text sizes');
  expect(errors).toContain('unsupported card text size');
  await page.locator('strong').evaluate(el => el.removeAttribute('style'));
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  expect(await page.evaluate(measureDesign)).toEqual([]);
});

test('design checker rejects decorative or misplaced arrows and permits one trailing CTA arrow', async ({page}) => {
  await page.setContent('<a class="button" href="#"><span>Start</span><svg class="lucide lucide-arrow-right cta-arrow"></svg></a>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureDesign)).toEqual([]);
  await page.locator('svg').evaluate(el => el.classList.replace('lucide-arrow-right','lucide-arrow-up-right'));
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('decorative control arrow');
  await page.locator('svg').evaluate(el => { el.classList.replace('lucide-arrow-up-right','lucide-arrow-right'); el.parentElement.prepend(el); });
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('invalid CTA arrow');
  await page.locator('svg').evaluate(el => el.parentElement.append(el));
  expect(await page.evaluate(measureDesign)).toEqual([]);
  await page.locator('a').evaluate(el => el.className = 'text-link');
  expect(await page.evaluate(measureDesign)).toEqual([]);
  await page.locator('a').evaluate(el => el.className = '');
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('invalid CTA arrow');
  await page.locator('a').evaluate(el => el.className = 'text-link');
  await page.locator('a').evaluate(el => el.append(el.querySelector('svg').cloneNode(true)));
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('invalid CTA arrow');
});

test('design checker rejects compressed section spacing on phone and desktop', async ({page}) => {
  await page.setContent('<main class="redesign-home"><section>Section content</section></main>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const width of [320,1920]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(measureDesign)).toEqual([]);
    for (const edge of ['Top','Bottom']) {
      await page.locator('section').evaluate((el,edge) => el.style['padding'+edge] = '8px',edge);
      expect((await page.evaluate(measureDesign)).join('\n')).toContain('compressed section spacing');
      await page.locator('section').evaluate(el => el.removeAttribute('style'));
      expect(await page.evaluate(measureDesign)).toEqual([]);
    }
  }
});

test('design checker keeps badges filled within their silhouettes, without painted tiles', async ({page}) => {
  await page.setContent('<main class="redesign-home"><span class="card-badge">◇</span><input class="field-control" aria-label="Search"><div class="protection-layer">Allowed access</div></main>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/components/landing/workflow-card.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureDesign)).toEqual([]);
  for (const selector of ['.field-control','.protection-layer']) await expect(page.locator(selector)).toHaveCSS('border-top-width','1px');
  for (const edge of ['Top','Right','Bottom','Left']) {
    await page.locator('.card-badge').evaluate((el,edge) => el.style['border'+edge] = '1px solid red',edge);
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('card border');
    await page.locator('.card-badge').evaluate(el => el.removeAttribute('style'));
    expect(await page.evaluate(measureDesign)).toEqual([]);
  }
  for (const [property,value] of [['backgroundColor','red'],['backgroundImage','linear-gradient(red,blue)'],['boxShadow','0 2px 8px black']]) {
    await page.locator('.card-badge').evaluate((el,{property,value}) => el.style[property] = value,{property,value});
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('badge painted as a tile');
    await page.locator('.card-badge').evaluate(el => el.removeAttribute('style'));
  }
  await page.locator('.card-badge').evaluate(el => el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4Z" /></svg>');
  expect(await page.evaluate(measureDesign)).toEqual([]);
  await page.locator('.card-badge svg').evaluate(el => el.style.fill = 'none');
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('badge icon missing fill');
});

test('cards and badges inherit their semantic palette in both themes', async ({page}) => {
  const card = tone => `<div class="surface-card workflow-card" data-card-tone="${tone}"><h3 class="workflow-card-heading"><span class="card-badge"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg></span><span class="workflow-card-title">A ${tone} card</span></h3></div>`;
  await page.setContent(`<main class="redesign-home">${['neutral','manual','prepared','result'].map(card).join('')}</main>`);
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/styles/feedback.css','src/components/landing/workflow-card.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const theme of ['light','dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme,theme);
    expect(await page.evaluate(measureDesign)).toEqual([]);
    const icon = page.locator('[data-card-tone=neutral] .card-badge svg');
    await icon.evaluate(el => el.style.color = 'var(--blue)');
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('badge icon differs from its card palette');
    await icon.evaluate(el => el.removeAttribute('style'));
    const result = page.locator('[data-card-tone=result]');
    await result.evaluate(el => el.style.backgroundColor = 'var(--manual-bg)');
    expect((await page.evaluate(measureDesign)).join('\n')).toContain('card differs from its semantic palette');
    await result.evaluate(el => el.removeAttribute('style'));
    expect(await page.evaluate(measureDesign)).toEqual([]);
  }
});

test('badge icons share height while retaining their native proportions', async ({page}) => {
  await page.setContent('<div><span class="card-badge"><svg viewBox="0 0 24 24"><path d="M2 2h20v20H2Z" /></svg></span></div><div><span class="card-badge"><svg viewBox="0 0 64 56"><rect x="5" y="5" width="54" height="46" /></svg></span></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureDesign)).toEqual([]);
  await page.locator('svg').last().evaluate(el => el.style.width = '100%');
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('badge icon viewport does not preserve its aspect ratio');
  await page.locator('svg').last().evaluate(el => el.removeAttribute('style'));
  await page.locator('svg').last().evaluate(el => el.style.height = '24px');
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('badge icon height differs from shared size');
});

test('interface icons share line weight across sizes and SVG coordinate systems', async ({page}) => {
  await page.setContent('<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3h18v18H3Z" /></svg><svg class="magpie-toolkit" viewBox="0 0 64 56" fill="none" stroke="currentColor" aria-hidden="true"><rect x="5" y="13" width="54" height="38" rx="8" /></svg>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureDesign)).toEqual([]);
  for (const size of [11,24,44]) {
    await page.locator('svg').evaluateAll((icons,size) => icons.forEach(icon => { icon.style.width = size+'px'; icon.style.height = size+'px'; }),size);
    expect(await page.evaluate(measureDesign)).toEqual([]);
  }
  for (const [property,value,message] of [['strokeWidth','3px','icon stroke'],['vectorEffect','none','inconsistent icon drawing'],['strokeLinecap','square','inconsistent icon drawing']]) {
    await page.locator('path').evaluate((el,{property,value}) => el.style[property] = value,{property,value});
    expect((await page.evaluate(measureDesign)).join('\n')).toContain(message);
    await page.locator('path').evaluate(el => el.removeAttribute('style'));
    expect(await page.evaluate(measureDesign)).toEqual([]);
  }
});

test('layout checker rejects displaced, clipped and overlapping card badges', async ({page}) => {
  await page.setContent('<style>*{box-sizing:border-box}.workflow-card{width:400px}</style><div class="surface-card workflow-card"><h2 class="workflow-card-heading"><span class="card-badge" aria-hidden="true">◇</span><span class="workflow-card-title">Card title</span></h2><div class="workflow-card-body">Content</div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/components/landing/workflow-card.css','src/components/landing/centered-label.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('.card-badge').evaluate(el => el.style.transform = 'translateX(-80px)');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/misplaced card badge/);
  await page.locator('.workflow-card').evaluate(el => el.style.overflow = 'hidden');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/clipped card badge/);
  await page.locator('.workflow-card').evaluate(el => el.removeAttribute('style'));
  await page.locator('.card-badge').evaluate(el => el.removeAttribute('style'));
  await page.locator('.workflow-card-title').evaluate(el => el.style.transform = 'translateX(-60px)');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/card badge overlaps title/);
});

test('layout checker rejects divergent action link spacing and decoration', async ({page}) => {
  await page.setContent('<style>:root{--space-2:8px}.text-link{display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}.text-link:is(:hover,:focus-visible){text-decoration:underline}</style><a href="#" class="text-link">Explore guides <span>↗</span></a>');
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('a').evaluate(el => el.style.textDecoration = 'underline');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/inconsistent action link decoration/);
  await page.locator('a').evaluate(el => { el.removeAttribute('style'); el.style.justifyContent = 'space-between'; el.style.width = '400px'; });
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/inconsistent action link spacing/);
  await page.locator('a').evaluate(el => { el.removeAttribute('style'); el.style.gap = '24px'; });
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/inconsistent action link spacing/);
  await page.locator('a').evaluate(el => el.removeAttribute('style'));
  await page.locator('a').hover(); expect(await page.evaluate(measureLayout)).toEqual([]);
});

test('chart phase badges obey the shared placement rule and cannot disappear', async ({page}) => {
  await page.setContent('<style>.chart-phases{width:400px;margin-top:40px}.chart-phases>div{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 12px}</style><div class="chart-phases"><div><span class="card-badge" aria-hidden="true">◇</span><span class="centered-label"><span class="centered-label-text">A phase</span></span></div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/components/landing/centered-label.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureLayout)).toEqual([]);
  expect(await page.evaluate(measureDesign)).toEqual([]);
  const badge = page.locator('.card-badge');
  await badge.evaluate(el => el.style.transform = 'translateY(-60px)');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('misplaced card badge');
  await badge.evaluate(el => { el.removeAttribute('style'); el.style.width = '30px'; });
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('badge size');
  await badge.evaluate(el => el.removeAttribute('style'));
  await badge.evaluate(el => el.style.transform = 'translateY(-60px)');
  await page.locator('.chart-phases').evaluate(el => el.style.overflow = 'hidden');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('clipped card badge');
  await page.locator('.chart-phases').evaluate(el => el.removeAttribute('style'));
  await badge.evaluate(el => el.removeAttribute('style'));
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await badge.evaluate(el => el.remove());
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('chart phase missing shared badge');
});

test('card checklists keep a stable bounded column, stay centered and wrap long text', async ({page}) => {
  await page.setContent('<div class="surface-card workflow-card" style="width:500px;max-width:100%"><h2 class="workflow-card-heading">Magpie</h2><div class="workflow-card-body"><ul class="workflow-checklist"><li><svg aria-hidden="true"></svg><span>Investigates the report</span></li><li><svg aria-hidden="true"></svg><span>Coordinates release and CVE</span></li></ul></div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/components/landing/workflow-card.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureLayout)).toEqual([]);
  expect(await page.evaluate(measureDesign)).toEqual([]);
  const list = page.locator('.workflow-checklist');
  for (const [property,value,error] of [
    ['width','fit-content','inconsistent card checklist column'],
    ['width','100%','inconsistent card checklist column'],
    ['marginInline','0','off-center card checklist'],
    ['textAlign','center','card checklist text alignment'],
  ]) {
    await list.evaluate((el,{property,value}) => el.style[property] = value,{property,value});
    expect([...(await page.evaluate(measureLayout)),...(await page.evaluate(measureDesign))].join('\n')).toContain(error);
    await list.evaluate(el => el.removeAttribute('style'));
    expect(await page.evaluate(measureLayout)).toEqual([]);
    expect(await page.evaluate(measureDesign)).toEqual([]);
  }
  const initialLeft = await list.evaluate(el => el.getBoundingClientRect().left);
  await list.locator('span').first().evaluate(el => el.textContent = 'Checks');
  await list.locator('span').last().evaluate(el => el.textContent = 'Drafts');
  expect(await list.evaluate(el => el.getBoundingClientRect().left)).toBeCloseTo(initialLeft,1);
  await page.setViewportSize({width:320,height:900});
  await list.locator('span').last().evaluate(el => el.textContent = 'VeryLongWorkflowIdentifier'.repeat(8));
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await expect(list.locator('span').last()).toBeVisible();
  expect(await list.evaluate(el => el.scrollWidth <= el.clientWidth + 2)).toBe(true);
  const wrappedRow = list.locator('li').last();
  await wrappedRow.evaluate(el => el.style.alignItems = 'center');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('checklist icon not on first line');
  await wrappedRow.evaluate(el => el.removeAttribute('style'));
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  expect(await page.evaluate(measureLayout)).toEqual([]);
  expect(await page.evaluate(measureDesign)).toEqual([]);
});

test('chart captions keep the note at the left edge and the data link at the right', async ({page}) => {
  await page.setContent('<figure class="airflow-chart-story"><div style="height:100px">Chart</div><figcaption class="chart-note" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:var(--heading-gap)"><span>Illustrative trends</span><a href="#data">View data →</a></figcaption></figure>');
  await page.addStyleTag({content:readFileSync('src/styles/spacing.css','utf8')});
  for (const width of [320,1524]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(measureLayout)).toEqual([]);
    await page.locator('.chart-note').evaluate(el => el.style.justifyContent = 'center');
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('chart caption is not aligned to its edges');
    await page.locator('.chart-note').evaluate(el => el.style.justifyContent = 'space-between');
    await page.locator('.chart-note').evaluate(el => el.style.marginTop = '0');
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('crowded chart caption');
    await page.locator('.chart-note').evaluate(el => el.style.marginTop = 'var(--heading-gap)');
  }
});

test('result illustration icons have filled silhouettes without background tiles', async ({page}) => {
  await page.setContent('<div class="illustration-pair" aria-hidden="true"><div><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg><span>Result</span></div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureDesign)).toEqual([]);
  const icon = page.locator('.illustration-pair svg');
  await icon.evaluate(el => el.style.background = 'white');
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('illustration icon painted as a tile');
  await icon.evaluate(el => { el.style.background = ''; el.parentElement.style.background = 'white'; });
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('illustration icon painted as a tile');
  await icon.evaluate(el => { el.parentElement.style.background = ''; el.style.fill = 'none'; });
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('illustration icon missing fill');
});

test('comparison cards share text columns and size headings to their content', async ({page}) => {
  const card = (title,items) => `<div class="surface-card workflow-card"><h3 class="workflow-card-heading"><span class="centered-label"><span class="centered-label-text">${title}</span></span></h3><div class="workflow-card-body"><ul class="workflow-checklist">${items.map(text => `<li><svg aria-hidden="true"></svg><span>${text}</span></li>`).join('')}</ul></div></div>`;
  await page.setContent(`<div style="display:grid;min-height:600px"><div class="story-comparison">${card('The old way',['You reproduce the bug','You run the checks'])}${card('Magpie',['You review how to reproduce the bug','You review the check results'])}</div></div>`);
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/components/landing/workflow-card.css','src/components/landing/centered-label.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('.story-comparison').evaluate(el => el.style.alignSelf = 'stretch');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('comparison lists stretched beyond content');
  await page.locator('.story-comparison').evaluate(el => el.removeAttribute('style'));
  await page.locator('.workflow-card').first().evaluate(el => el.style.rowGap = '40px');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('inconsistent card content gap');
  await page.locator('.workflow-card').first().evaluate(el => el.removeAttribute('style'));
  await page.locator('.workflow-checklist').first().evaluate(el => el.style.width = 'fit-content');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('unequal comparison text columns');
  await page.locator('.workflow-checklist').first().evaluate(el => el.removeAttribute('style'));
  await page.locator('.workflow-card-heading').first().evaluate(el => el.style.minHeight = '100px');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('empty space in card heading');
  await page.locator('.workflow-card-heading').first().evaluate(el => el.removeAttribute('style'));
  await page.locator('.workflow-card').evaluateAll(cards => cards.forEach((card,index) => {
    const note = document.createElement('p'); note.className = 'workflow-card-emphasis';
    note.textContent = index ? 'I finally have enough context to work out what to do next.' : 'This is exhausting!';
    card.append(note);
  }));
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('.workflow-card-emphasis').evaluateAll(notes => notes.forEach(el => el.style.marginTop = '0'));
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('crowded card reaction');
  await page.locator('.workflow-card-emphasis').evaluateAll(notes => notes.forEach(el => el.removeAttribute('style')));
  await page.locator('.workflow-card-emphasis').first().evaluate(el => el.style.transform = 'translateY(12px)');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('unequal .workflow-card-emphasis');
  await page.locator('.workflow-card-emphasis').first().evaluate(el => el.removeAttribute('style'));
  await page.locator('.workflow-card-emphasis').first().evaluate(el => el.style.textAlign = 'left');
  expect((await page.evaluate(measureDesign)).join('\n')).toContain('card emphasis is not centered');
  await page.locator('.workflow-card-emphasis').first().evaluate(el => el.removeAttribute('style'));
  expect(await page.evaluate(measureDesign)).toEqual([]);
  await page.locator('.workflow-checklist').first().evaluate(el => el.append(el.firstElementChild.cloneNode(true)));
  await page.locator('.centered-label-text').last().evaluate(el => el.textContent = 'A longer heading that naturally wraps across more than one line');
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.setViewportSize({width:320,height:900});
  await page.locator('.workflow-checklist span').first().evaluate(el => el.textContent = 'A longer checklist item wrapping over several lines on a narrow phone');
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('.workflow-checklist').first().evaluate(el => el.style.height = '600px');
  expect((await page.evaluate(measureLayout)).join('\n')).toContain('comparison lists stretched beyond content');
});

test('layout checker rejects overflow, asymmetric margins, card padding and row misalignment', async ({ page }) => {
  await page.setContent('<style>:root{--page-gutter:20px;--card-padding:24px}*{box-sizing:border-box}.container{width:800px;margin:0 auto}.docs-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.workflow-card{padding:24px}.workflow-card-heading{margin:0}.workflow-card-body{margin-top:24px}</style><main class="container"><div class="docs-card-grid"><div class="workflow-card"><h2 class="workflow-card-heading">One</h2><div class="workflow-card-body">Body</div></div><div class="workflow-card"><h2 class="workflow-card-heading">Two</h2><div class="workflow-card-body">Body</div></div></div></main>');
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('h2').first().evaluate(el => { el.style.width = '30px'; el.style.overflow = 'hidden'; el.style.whiteSpace = 'nowrap'; el.textContent = 'Clipped label'; });
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/clipped text/);
  await page.locator('h2').first().evaluate(el => { el.removeAttribute('style'); el.textContent = 'One'; });
  await page.locator('.container').evaluate(el => el.style.marginLeft = '10px');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/unequal page margins/);
  await page.locator('.container').evaluate(el => el.style.marginLeft = '');
  await page.locator('.workflow-card').last().evaluate(el => el.style.paddingTop = '37px');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/inconsistent card padding/);
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/unequal .workflow-card-heading/);
  await page.locator('.container').evaluate(el => el.style.width = '2200px');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/document overflow/);
});

test('layout checker rejects misplaced section titles, shifted wrappers and left-aligned text', async ({page}) => {
  await page.setContent(`<style>
    :root{--page-gutter:20px}*{box-sizing:border-box}
    .container{width:800px;margin-inline:auto}
    .intro{width:700px;margin-inline:auto}
    .redesign-home h2{max-width:500px;text-align:center;margin-block:0 24px}
    .fixture-heading{margin-inline:auto}
  </style><main class="redesign-home"><section class="container">
    <h2 class="fixture-heading">A standalone title</h2>
    <div class="intro"><h2 class="fixture-heading">A title inside a wrapper</h2></div>
    <div class="workflow-card"><h2>Card title has its own local axis</h2></div>
  </section></main><article><h2>Ordinary article headings need not be centered</h2></article>`);
  expect(await page.evaluate(measureLayout)).toEqual([]);
  // Reproduce the original cascade defect: a more specific shorthand cancels
  // the lower-specificity auto inline margins despite centered text.
  const override = await page.addStyleTag({content:'.redesign-home :is(.intro h2,.fixture-heading){margin:0 0 24px}'});
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/off-center section heading: A standalone title/);
  await override.evaluate(el => el.remove());
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('.intro').evaluate(el => el.style.marginInline = '0');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/off-center section heading: A title inside a wrapper/);
  await page.locator('.intro').evaluate(el => el.removeAttribute('style'));
  await page.locator('.fixture-heading').first().evaluate(el => el.style.textAlign = 'left');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/section heading text alignment: A standalone title/);
});

test('layout checker rejects unbalanced icon labels outside cards', async ({page}) => {
  await page.setContent('<div style="width:400px"><span class="centered-label" data-icon="true"><span class="centered-label-icon" aria-hidden="true">◇</span><span class="centered-label-text">A label with a leading icon</span></span></div>');
  await page.addStyleTag({content:readFileSync('src/components/landing/centered-label.css','utf8')});
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('.centered-label').evaluate(el => el.style.gridTemplateColumns = '56px 1fr');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/off-center shared label/);
  await page.locator('.centered-label').evaluate(el => el.removeAttribute('style'));
  await page.locator('.centered-label-text').evaluate(el => el.style.textAlign = 'left');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/shared label text alignment/);
  await page.locator('.centered-label-text').evaluate(el => el.removeAttribute('style'));
  await page.locator('.centered-label').evaluate(el => el.dataset.stacked = 'true');
  expect(await page.evaluate(measureLayout)).toEqual([]);
  await page.locator('.centered-label-icon').evaluate(el => el.style.justifySelf = 'start');
  expect((await page.evaluate(measureLayout)).join('\n')).toMatch(/misplaced stacked label icon/);
});


test('workflow blocks have room between the stage rail and its content', async ({page}) => {
  await page.setContent('<div class="security-workbench"><div class="workflow-stages"><button>Report</button></div><div class="security-prompts"><h4>A security report arrives</h4></div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const width of [375,1524]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(measureLayout)).toEqual([]);
    await page.locator('.security-prompts').evaluate(el => el.style.marginTop = '24px');
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('crowded workflow blocks');
    await page.locator('.security-prompts').evaluate(el => el.removeAttribute('style'));
  }
});

test('security title spacing includes the card surfaces on phone and desktop', async ({page}) => {
  await page.setContent('<div class="security-workbench"><div class="security-prompts"><h4>A security report is ready to close</h4></div><div class="security-scenes"><section class="security-scene"><div class="story-comparison"><div class="surface-card workflow-card"><h4 class="workflow-card-heading"><span class="card-badge" aria-hidden="true">◇</span><span class="workflow-card-title">Magpie</span></h4><div class="workflow-card-body">Review the prepared report</div></div></div></section></div></div>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css','src/components/landing/workflow-card.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const width of [375,1524]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(measureLayout)).toEqual([]);
    await page.locator('.security-prompts').evaluate(el => el.style.marginBottom = '24px');
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('crowded security title and cards');
    await page.locator('.security-prompts').evaluate(el => el.removeAttribute('style'));
    expect(await page.evaluate(measureLayout)).toEqual([]);
  }
});


test('reading introductions align their heading and prose on desktop and phones', async ({page}) => {
  await page.setContent('<main class="redesign-home"><section class="container"><div class="learning-intro"><img alt="" width="120" height="120"><div class="lifecycle-heading"><h2>Learn with your agent</h2><p>Practical guides for everyday work, with enough room to read the explanation on a phone.</p></div></div></section></main>');
  for (const file of ['src/styles/spacing.css','src/styles/redesign.css','src/styles/reading-flow.css']) await page.addStyleTag({content:readFileSync(file,'utf8')});
  for (const width of [375,1440]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(measureLayout)).toEqual([]);
    await page.locator('h2').evaluate(el => el.style.transform = 'translateX(20px)');
    expect((await page.evaluate(measureLayout)).join('\n')).toContain('unaligned reading introduction');
    await page.locator('h2').evaluate(el => el.removeAttribute('style'));
    if (width < 800) {
      const sizes = await page.locator('.learning-intro').evaluate(el => ({intro:el.getBoundingClientRect().width,prose:el.querySelector('p').getBoundingClientRect().width}));
      expect(Math.abs(sizes.intro-sizes.prose)).toBeLessThan(2);
    }
  }
});
