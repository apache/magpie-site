// Check the rendered contract, so page-specific CSS cannot silently override
// the shared components. The same function audits pages and broken fixtures.
export function measureDesign() {
  const errors = [], visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert],[aria-hidden=true]');
  const probe = document.createElement('span');
  // Even a reduced-motion .01ms transition can expose the previous token
  // during synchronous reads. The measuring node never participates in motion.
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;transition:none!important;animation:none!important';
  document.body.append(probe);
  const token = (name, property = 'width') => {
    probe.style[property] = `var(${name})`;
    return parseFloat(getComputedStyle(probe)[property]);
  };
  const reading = token('--text-reading','fontSize'), small = token('--text-small','fontSize');
  const controlRadius = token('--radius-control'), roundRadius = token('--radius-round'), cardRadius = token('--radius-card');
  const badgeSize = token('--card-badge-size'), iconStroke = token('--icon-stroke');
  const displayIconHeight = badgeSize - token('--space-3');
  const padding = token('--card-padding'), gap = token('--space-2'), title = token('--title-card','fontSize');
  const pageTitle = token('--title-page','fontSize'), leadSize = token('--text-lead','fontSize');
  const sectionPadding = token('--section-padding');
  probe.style.fontSize = reading+'px';
  const cardMeasure = token('--card-measure'), cardWidth = token('--card-width');
  probe.style.boxShadow = 'var(--surface-shadow)';
  const surfaceShadow = getComputedStyle(probe).boxShadow;
  probe.remove();
  const equal = (el, property, expected, label, tolerance = .5) => {
    const actual = parseFloat(getComputedStyle(el)[property]);
    if (!Number.isFinite(actual) || !Number.isFinite(expected) || Math.abs(actual - expected) > tolerance) errors.push(`${label}: ${property}=${actual}, expected ${expected} (${el.className})`);
  };
  for (const section of document.querySelectorAll('.redesign-home > section')) {
    if (!visible(section)) continue;
    for (const edge of ['Top','Bottom']) if (parseFloat(getComputedStyle(section)['padding'+edge]) < sectionPadding - .5) errors.push('compressed section spacing: ' + section.className);
  }
  for (const button of document.querySelectorAll('.button')) {
    if (!visible(button)) continue;
    const compact = button.classList.contains('button-small'), icon = button.classList.contains('button-icon');
    equal(button,'fontSize',compact ? small : reading,'button typography');
    equal(button,'fontWeight',550,'button typography');
    if (getComputedStyle(button).fontFamily !== getComputedStyle(document.body).fontFamily) errors.push('button font family: ' + button.className);
    equal(button,'lineHeight',(compact ? small : reading)*1.5,'button typography');
    equal(button,'borderTopLeftRadius',button.classList.contains('button-round') ? roundRadius : controlRadius,'button shape');
    equal(button,'minHeight',44,'button target');
    equal(button,'columnGap',gap,'button spacing');
    equal(button,'paddingLeft',icon ? 10 : compact ? 12 : 20,'button spacing');
    equal(button,'paddingRight',icon ? 10 : compact ? 12 : 20,'button spacing');
    if (getComputedStyle(button).textDecorationLine !== 'none') errors.push('button underline: ' + button.textContent.trim());
  }
  for (const field of document.querySelectorAll('select,.field-control')) {
    if (!visible(field)) continue;
    if (!field.classList.contains('field-control')) errors.push('field missing shared control: ' + field.id);
    equal(field,'fontSize',reading,'field typography');
    equal(field,'borderTopLeftRadius',controlRadius,'field shape');
    equal(field,'minHeight',44,'field target');
    equal(field,'paddingLeft',12,'field spacing');
  }
  for (const navigation of document.querySelectorAll('.sequence-navigation')) {
    if (!visible(navigation)) continue;
    const controls = [...navigation.querySelectorAll(':scope > .sequence-body > button,:scope > .sequence-body > a')];
    if (controls.length !== 2) errors.push('sequence requires two navigation controls');
    for (const [index,control] of controls.entries()) {
      if (!control.matches('.button.button-soft.button-icon.button-round') || !control.getAttribute('aria-label') || control.textContent.trim() || !control.querySelector(index === 0 ? '.lucide-chevron-left' : '.lucide-chevron-right')) errors.push('inconsistent sequence navigation control');
      const s = getComputedStyle(control);
      document.body.append(probe);
      probe.style.backgroundColor = s.getPropertyValue(control.matches(':hover') ? '--action-soft-hover' : '--action-soft-bg');
      if (s.backgroundColor !== getComputedStyle(probe).backgroundColor) errors.push('sequence control missing subtle background');
      probe.remove();
    }
  }
  for (const card of document.querySelectorAll('.surface-card,.workflow-card')) {
    if (!visible(card)) continue;
    equal(card,'borderTopLeftRadius',cardRadius,'card shape');
    for (const edge of ['Top','Right','Bottom','Left']) equal(card,'padding'+edge,padding,'card padding');
    for (const heading of card.querySelectorAll('.workflow-card-heading,h2,h3')) if (visible(heading)) {
      equal(heading,'fontSize',title,'card typography');
      equal(heading,'lineHeight',title*1.25,'card typography');
    }
    for (const paragraph of card.querySelectorAll('p')) if (visible(paragraph)) equal(paragraph,'fontSize',reading,'card body typography');
  }
  for (const card of document.querySelectorAll('.workflow-card')) {
    if (!visible(card)) continue;
    const tone = card.dataset.cardTone;
    if (['manual','prepared','result'].includes(tone)) {
      const s = getComputedStyle(card);
      document.body.append(probe);
      probe.style.backgroundColor = s.getPropertyValue(`--${tone}-bg`);
      probe.style.color = s.getPropertyValue(`--${tone}-ink`);
      const palette = getComputedStyle(probe);
      if (s.backgroundColor !== palette.backgroundColor || s.color !== palette.color) errors.push('card differs from its semantic palette');
      for (const note of card.querySelectorAll(':scope > .workflow-card-emphasis')) {
        if (getComputedStyle(note).color !== s.color) errors.push('card emphasis differs from its semantic palette');
      }
      probe.remove();
    }
    for (const note of card.querySelectorAll(':scope > .workflow-card-emphasis')) {
      if (getComputedStyle(note).textAlign !== 'center') errors.push('card emphasis is not centered');
    }
    if (card.parentElement.matches('.reel-flow,.lifecycle-flow,.story-comparison,.learning-grid,.card-flow') && card.getBoundingClientRect().width > cardWidth + .5) errors.push('overwide workflow card');
    for (const list of card.querySelectorAll('.workflow-checklist')) {
      const available = list.parentElement.getBoundingClientRect().width;
      if (Math.abs(list.getBoundingClientRect().width-Math.min(available,cardMeasure)) > .5) errors.push('inconsistent card checklist column');
    }
    for (const paragraph of card.querySelectorAll('p')) {
      if (!visible(paragraph)) continue;
      const r = paragraph.getBoundingClientRect(), owner = paragraph.parentElement.getBoundingClientRect();
      if (r.width > cardMeasure + .5) errors.push('overwide card prose');
      if (Math.abs((r.left+r.right-owner.left-owner.right)/2) > 2) errors.push('off-center card prose column');
    }
  }
  for (const surface of document.querySelectorAll('.surface-card,.chart-frame,.reference-table,.docs-prose table,.chart-table-scroll')) {
    if (visible(surface) && (surfaceShadow === 'none' || getComputedStyle(surface).boxShadow !== surfaceShadow)) errors.push('inconsistent surface shadow');
  }
  for (const card of document.querySelectorAll('.surface-card,.tool-entry,.case-quote')) {
    if (!visible(card)) continue;
    const allowedSizes = card.matches('.case-quote') ? [reading,leadSize] : card.matches('.copy-block') ? [reading,small] : [reading,title];
    const walker = document.createTreeWalker(card,NodeFilter.SHOW_TEXT), sizes = new Set();
    let node;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      if (!node.textContent.trim() || !visible(el) || el.closest('svg,script,style,.sr-only')) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      sizes.add(size);
      if (!allowedSizes.some(expected => Math.abs(size-expected) < .5)) errors.push('unsupported card text size: ' + size + ' in ' + card.className);
    }
    if (sizes.size > 2) errors.push('more than two card text sizes: ' + card.className);
  }
  // Group shared cards by their fill; controls and diagram boundaries retain
  // their meaningful strokes. Focus/hover outlines remain available too.
  for (const surface of document.querySelectorAll('.surface-card,.card-badge')) {
    const badge = surface.matches('.card-badge');
    if (!visible(badge ? surface.parentElement : surface)) continue;
    for (const edge of ['Top','Right','Bottom','Left']) equal(surface,'border'+edge+'Width',0,'card border');
    if (badge) {
      equal(surface,'width',badgeSize,'badge size');
      equal(surface,'height',badgeSize,'badge size');
      const s = getComputedStyle(surface);
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none' || s.boxShadow !== 'none') errors.push('badge painted as a tile');
      const icon = surface.querySelector(':scope > svg');
      if (icon) {
        const heading = surface.closest('.workflow-card-heading') ?? surface.parentElement.querySelector('.workflow-card-heading');
        if (heading && getComputedStyle(icon).color !== getComputedStyle(heading).color) errors.push('badge icon differs from its card palette');
        const fill = getComputedStyle(icon).fill;
        if (fill === 'none' || fill === 'rgba(0, 0, 0, 0)') errors.push('badge icon missing fill');
        const r = icon.getBoundingClientRect(), view = icon.viewBox.baseVal;
        const height = badgeSize - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
        if (Math.abs(r.height-height) > .5) errors.push('badge icon height differs from shared size');
        if (view.height && Math.abs(r.width/r.height-view.width/view.height) > .02) errors.push('badge icon viewport does not preserve its aspect ratio');
      }
    }
  }
  // Repeated labels carry the same meaning even in inactive walkthrough stages.
  const labelIcons = new Map();
  for (const owner of document.querySelectorAll('.workflow-card-heading,.chart-phases > div')) {
    const title = owner.querySelector('.workflow-card-title,.centered-label-text')?.textContent.trim();
    const icon = owner.querySelector('.card-badge > svg');
    if (!title || !icon) continue;
    const drawing = icon.getAttribute('viewBox') + icon.innerHTML;
    if (labelIcons.has(title) && labelIcons.get(title) !== drawing) errors.push('same title has different icons: ' + title);
    labelIcons.set(title,drawing);
  }
  for (const icon of document.querySelectorAll('.illustration-pair > div > svg')) {
    if (!icon.getClientRects().length || getComputedStyle(icon).visibility === 'hidden' || icon.closest('[inert]')) continue;
    for (const surface of [icon,icon.parentElement]) {
      const s = getComputedStyle(surface);
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none' || s.boxShadow !== 'none') errors.push('illustration icon painted as a tile');
    }
    if (getComputedStyle(icon).fill === 'none') errors.push('illustration icon missing fill');
    equal(icon,'height',displayIconHeight,'illustration icon height');
  }
  for (const icon of document.querySelectorAll('svg.lucide,svg.magpie-toolkit')) {
    // Decorative icons are aria-hidden; inactive panels and collapsed trees
    // still need to be excluded using their actual rendered visibility.
    if (!icon.getClientRects().length || getComputedStyle(icon).visibility === 'hidden' || icon.closest('[inert]')) continue;
    for (const shape of icon.querySelectorAll('path,rect,circle,line,polyline,polygon,ellipse')) {
      equal(shape,'strokeWidth',iconStroke,'icon stroke',.05);
      const s = getComputedStyle(shape);
      if (s.vectorEffect !== 'non-scaling-stroke' || s.strokeLinecap !== 'round' || s.strokeLinejoin !== 'round') errors.push('inconsistent icon drawing: ' + icon.getAttribute('class'));
    }
  }
  for (const heading of document.querySelectorAll('h1')) if (visible(heading) && !heading.closest('.hero')) equal(heading,'fontSize',pageTitle,'page title typography');
  for (const control of document.querySelectorAll('a,button')) {
    if (!visible(control)) continue;
    if (control.querySelector('.lucide-arrow-up-right,.lucide-arrow-left') || /[↗↵]/.test(control.textContent)) errors.push('decorative control arrow: ' + control.textContent.trim());
    for (const arrow of control.querySelectorAll('.lucide-arrow-right,.cta-arrow')) {
      if (arrow.matches('.lucide-arrow-right.card-link-arrow') && control.matches('a.surface-card.card-link') && arrow === control.lastElementChild && control.querySelectorAll('.card-link-arrow').length === 1) continue;
      if (!arrow.matches('.lucide-arrow-right.cta-arrow') || !control.matches('a:is(.button,.text-link)') || arrow !== control.lastElementChild || control.querySelectorAll('.cta-arrow').length !== 1) errors.push('invalid CTA arrow: ' + control.textContent.trim());
    }
  }
  const stages = [...document.querySelectorAll('[role=tablist]')].filter(visible);
  for (const stage of stages) {
    if (!stage.classList.contains('workflow-stages')) errors.push('sequence missing shared stages');
    for (const point of stage.querySelectorAll('.workflow-stage-point')) {
      equal(point,'width',32,'stage marker'); equal(point,'height',32,'stage marker');
    }
  }
  return [...new Set(errors)];
}
