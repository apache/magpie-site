// Shared by real-page checks and intentionally broken browser fixtures.
export function measureLayout() {
  const errors = [], tolerance = 2, width = document.documentElement.clientWidth;
  const visible = el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert],[aria-hidden=true]');
  if (document.documentElement.scrollWidth > width + tolerance) errors.push('document overflow: ' + document.documentElement.scrollWidth + ' > ' + width);
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || el.closest('svg') || ['SCRIPT','STYLE','ASTRO-ISLAND','ASTRO-SLOT','ASTRO-STATIC-SLOT'].includes(el.tagName)) continue;
    const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
    // Content in genuine scroll regions may exceed that region, not the viewport.
    let scrolling = false;
    for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) if (/auto|scroll/.test(getComputedStyle(parent).overflowX)) scrolling = true;
    // The carousel rail intentionally moves inside its clipped viewport. Its
    // active slide and every descendant still undergo the full bounds check.
    const carouselRail = el.matches('.reel-window > .reel-track') && getComputedStyle(el.parentElement).overflowX === 'hidden';
    if (!scrolling && !carouselRail && (rect.right > width + tolerance || rect.left < -tolerance)) errors.push('outside viewport: ' + el.tagName + '.' + el.className);
    if (el.matches('h1,h2,h3,h4,h5,button,p') && !/auto|scroll/.test(style.overflowX)) {
      // scrollWidth includes decorative connectors outside tab buttons. Measure
      // actual text ranges so connectors cannot hide a real clipped label.
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let text;
      while ((text = walker.nextNode())) {
        if (!text.textContent.trim() || !visible(text.parentElement)) continue;
        const range = document.createRange(); range.selectNodeContents(text);
        if ([...range.getClientRects()].some(r => r.left < rect.left - tolerance || r.right > rect.right + tolerance)) errors.push('clipped text: ' + el.tagName + '.' + el.className + ' ' + text.textContent.trim().slice(0,80) + ` at ${width}`);
      }
    }
  }
  for (const el of document.querySelectorAll('.container,.header-inner')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (Math.abs(r.left - (width - r.right)) > tolerance) errors.push('unequal page margins: ' + el.className);
    const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-gutter'));
    if (r.left + tolerance < gutter) errors.push('page gutter too small: ' + el.className);
  }
  const docsShell = document.querySelector('.docs-shell'), header = document.querySelector('.header-inner');
  if (docsShell && header) {
    const a = docsShell.getBoundingClientRect(), b = header.getBoundingClientRect();
    if (Math.abs(a.left-b.left) > tolerance || Math.abs(a.right-b.right) > tolerance) errors.push('documentation shell differs from shared header width');
    const breadcrumb = docsShell.querySelector('.docs-breadcrumb'), article = docsShell.querySelector('.docs-prose');
    if (breadcrumb && article) {
      const c = breadcrumb.getBoundingClientRect(), d = article.getBoundingClientRect();
      if (Math.abs(c.left-d.left) > tolerance || Math.abs(c.right-d.right) > tolerance) errors.push('documentation breadcrumb differs from reading column');
    }
  }
  // Marketing section titles share the section's axis, even when their text
  // measure or an intermediate wrapper is narrower. Card titles have their own
  // local centering contract below; documentation headings remain left-aligned.
  for (const section of document.querySelectorAll('.redesign-home > section')) {
    const sectionRect = section.getBoundingClientRect();
    for (const heading of section.querySelectorAll('h1,h2,.lifecycle-heading > h3')) {
      if (!visible(heading) || heading.closest('.workflow-card')) continue;
      const r = heading.getBoundingClientRect(), label = heading.textContent.trim().slice(0,80);
      const readingIntro = heading.closest('.learning-intro');
      if (readingIntro) {
        const prose = readingIntro.querySelector('p').getBoundingClientRect();
        if (Math.abs(r.left-prose.left) > tolerance || getComputedStyle(heading).textAlign !== 'left') errors.push('unaligned reading introduction');
        continue;
      }
      const offset = (r.left + r.right - sectionRect.left - sectionRect.right) / 2;
      if (Math.abs(offset) > tolerance) errors.push(`off-center section heading: ${label} (${offset.toFixed(2)}px)`);
      if (getComputedStyle(heading).textAlign !== 'center') errors.push('section heading text alignment: ' + label);
    }
  }
  // A new step in the explanation needs more space than text within a heading.
  for (const rail of document.querySelectorAll('.workflow-stages')) {
    const next = rail.nextElementSibling;
    if (!visible(rail) || !next || !visible(next)) continue;
    const minimum = width <= 800 ? 48 : 64;
    if (next.getBoundingClientRect().top - rail.getBoundingClientRect().bottom < minimum - tolerance) errors.push('crowded workflow blocks');
  }
  // Measure the visible badge edge, not only the card surface below it.
  for (const sequence of document.querySelectorAll('.workflow-reel,.workflow-sequence')) {
    if (!visible(sequence) || width <= 1100) continue;
    const flow = [...sequence.querySelectorAll('.reel-flow,.lifecycle-flow,.story-comparison')].find(visible);
    const controls = [...sequence.querySelectorAll('.sequence-navigation button.button-icon')];
    if (!flow || controls.length !== 2) continue;
    const cards = [...flow.querySelectorAll(':scope > .workflow-card')];
    const bounds = cards.map(card => card.getBoundingClientRect());
    const center = (Math.min(...bounds.map(r => r.top)) + Math.max(...bounds.map(r => r.bottom))) / 2;
    for (const [i, control] of controls.entries()) {
      const r = control.getBoundingClientRect();
      if (Math.abs((r.top+r.bottom)/2-center) > tolerance) errors.push('sequence controls are not level with cards');
      if (i === 0 ? r.right > Math.min(...bounds.map(b => b.left)) : r.left < Math.max(...bounds.map(b => b.right))) errors.push('sequence controls overlap cards');
    }
  }
  for (const scene of document.querySelectorAll('.security-scene')) {
    if (!visible(scene)) continue;
    const heading = scene.closest('.security-workbench')?.querySelector('.security-prompts > :not([aria-hidden=true])');
    const cards = [...scene.querySelectorAll('.story-comparison > .workflow-card')];
    if (!heading || !cards.length) continue;
    const cardTop = Math.min(...cards.map(card => card.getBoundingClientRect().top));
    const minimumGap = parseFloat(getComputedStyle(scene).getPropertyValue('--space-12'));
    if (cardTop - heading.getBoundingClientRect().bottom < minimumGap - tolerance) errors.push('crowded security title and cards');
  }
  // These illustrations are decorative to assistive technology but their
  // visible connectors still belong on the icon row, independent of captions.
  for (const pair of document.querySelectorAll('.illustration-pair')) {
    if (!pair.getClientRects().length || getComputedStyle(pair).visibility === 'hidden' || pair.closest('[inert]')) continue;
    const connector = pair.querySelector(':scope > svg'), icons = [...pair.querySelectorAll(':scope > div > svg')];
    if (!connector || icons.length !== 2) continue;
    const centerY = el => { const r = el.getBoundingClientRect(); return (r.top+r.bottom)/2; };
    if (icons.some(icon => Math.abs(centerY(icon)-centerY(connector)) > tolerance)) errors.push('diagram connector is not aligned with icons');
  }
  for (const grid of document.querySelectorAll('.reel-flow,.lifecycle-flow,.story-comparison,.isolation-sides,.learning-grid,.card-flow,.tool-list,.docs-card-grid,.brand-grid,.arch-flow')) {
    if (!visible(grid)) continue;
    const children = [...grid.children].filter(el => visible(el) && el.tagName.toLowerCase() !== 'svg');
    // Visible process pieces share content-sized rows so their edges mate.
    // An inactive stage must never inflate those rows.
    const processCards = grid.matches('.puzzle-flow');
    const sideBySide = getComputedStyle(grid).gridTemplateColumns.split(' ').length > 1;
    if (processCards) {
      const bodies=children.map(card=>card.querySelector('.workflow-card-body')).filter(Boolean);
      const contentHeights=bodies.map(body=>{
        const rects=[...body.children].filter(visible).map(el=>el.getBoundingClientRect());
        return rects.length ? Math.max(...rects.map(r=>r.bottom))-Math.min(...rects.map(r=>r.top)) : body.getBoundingClientRect().height;
      });
      for (const [i,body] of bodies.entries()) {
        const natural=sideBySide?Math.max(...contentHeights):contentHeights[i];
        if (body.getBoundingClientRect().height>natural+tolerance) errors.push('process body exceeds its content row');
      }
    }
    const rows = new Map();
    for (const el of children) {
      const r = el.getBoundingClientRect(), y = Math.round(r.top);
      const row = [...rows.keys()].find(top => Math.abs(top - y) <= tolerance) ?? y;
      rows.set(row, [...(rows.get(row) ?? []), el]);
    }
    for (const row of rows.values()) {
      const bottoms = row.map(el => el.getBoundingClientRect().bottom);
      if (Math.max(...bottoms) - Math.min(...bottoms) > tolerance) errors.push('unequal card bottoms: ' + grid.className);
      const headings = row.map(el => el.querySelector('.workflow-card-heading')).filter(el => el?.querySelector('.workflow-card-title,.centered-label-text'));
      if (headings.length) {
        const contentHeight = Math.max(...headings.map(el => {
          const s = getComputedStyle(el);
          const textHeight = el.querySelector('.workflow-card-title,.centered-label-text').getBoundingClientRect().height;
          const iconHeight = el.querySelector('.card-badge')?.getBoundingClientRect().height ?? 0;
          return textHeight + iconHeight + (iconHeight ? parseFloat(s.rowGap) : 0) + parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
        }));
        if (headings.some(el => el.getBoundingClientRect().height > contentHeight + tolerance)) errors.push('empty space in card heading: ' + grid.className);
      }
      if (grid.matches('.story-comparison')) {
        const lists = row.map(el => el.querySelector('.workflow-checklist')).filter(Boolean);
        const widths = lists.map(el => el.getBoundingClientRect().width);
        if (widths.length > 1 && Math.max(...widths) - Math.min(...widths) > tolerance) errors.push('unequal comparison text columns');
        const naturalHeights = lists.map(list => {
          const s = getComputedStyle(list);
          const items = [...list.children].map(item => Math.max(...[...item.children].map(el => el.getBoundingClientRect().height)));
          if (!items.length) return 0;
          return (s.gridAutoRows === '1fr' ? Math.max(...items) * items.length : items.reduce((a,b) => a+b,0)) + parseFloat(s.rowGap) * Math.max(0,items.length-1);
        });
        if (lists.some(list => list.getBoundingClientRect().height > Math.max(...naturalHeights) + tolerance)) errors.push('comparison lists stretched beyond content');
      }
      for (const selector of ['.workflow-card-heading', '.workflow-card-body', '.workflow-card-emphasis', '.tool-meta', '.diagram-agent', '.learning-grid a']) {
        const targets = row.map(el => el.querySelector(selector)).filter(Boolean);
        if (targets.length < 2) continue;
        const positions = targets.map(el => el.getBoundingClientRect().top);
        if (Math.max(...positions) - Math.min(...positions) > tolerance) errors.push('unequal ' + selector + ' in ' + grid.className);
      }
    }
  }
  for (const card of document.querySelectorAll('.workflow-card')) {
    if (!visible(card)) continue;
    const style = getComputedStyle(card), padding = parseFloat(style.getPropertyValue('--card-padding'));
    if (Math.abs(parseFloat(style.rowGap) - parseFloat(style.getPropertyValue('--content-gap'))) > tolerance) errors.push('inconsistent card content gap: ' + card.className);
    const reaction = card.querySelector(':scope > .workflow-card-emphasis'), body = card.querySelector(':scope > .workflow-card-body');
    if (reaction && body && reaction.getBoundingClientRect().top - body.getBoundingClientRect().bottom < parseFloat(style.getPropertyValue('--heading-gap')) - tolerance) errors.push('crowded card reaction');
    for (const edge of ['Top','Right','Bottom','Left']) if (Math.abs(parseFloat(style['padding' + edge]) - padding) > tolerance) errors.push('inconsistent card padding: ' + card.className + ` ${edge}: ${style['padding' + edge]} expected ${padding}`);
    if (card.matches('.isolation-side')) {
      const diagram = card.querySelector('.agent-diagram'), prose = card.querySelector('.workflow-card-body > p');
      if (diagram && prose) {
        const a = diagram.getBoundingClientRect(), b = prose.getBoundingClientRect();
        if (Math.abs(a.left-b.left) > tolerance || Math.abs(a.right-b.right) > tolerance) errors.push('isolation diagram and prose need one content column');
      }
    }
    const label = card.querySelector('.centered-label-text'), heading = card.querySelector('.workflow-card-heading');
    if (label && heading) {
      const a = label.getBoundingClientRect(), b = heading.getBoundingClientRect();
      if (Math.abs((a.left + a.right) / 2 - (b.left + b.right) / 2) > tolerance) errors.push('off-center card heading: ' + card.className);
    }
    const title = card.querySelector('.workflow-card-title');
    if (title && heading) {
      const a = title.getBoundingClientRect(), b = heading.getBoundingClientRect();
      if (Math.abs((a.left+a.right-b.left-b.right)/2) > tolerance || getComputedStyle(title).textAlign !== 'center') errors.push('off-center card title');
    }
    for (const list of card.querySelectorAll('.workflow-checklist')) {
      const a = list.getBoundingClientRect(), b = (heading ?? card).getBoundingClientRect();
      if (Math.abs((a.left+a.right-b.left-b.right)/2) > tolerance) errors.push('off-center card checklist: ' + card.className);
      for (const text of list.querySelectorAll(':scope > li > span')) {
        const textStyle = getComputedStyle(text);
        if (textStyle.textAlign !== 'left') errors.push('card checklist text alignment: ' + card.className);
        const icon = text.previousElementSibling;
        if (icon?.matches('svg')) {
          const i = icon.getBoundingClientRect(), t = text.getBoundingClientRect();
          if (Math.abs((i.top+i.bottom)/2 - t.top - parseFloat(textStyle.lineHeight)/2) > tolerance) errors.push('checklist icon not on first line: ' + text.textContent.trim());
        }
      }
    }
  }
  for (const caption of document.querySelectorAll('.airflow-chart-story .chart-note')) {
    if (!visible(caption)) continue;
    const bounds = caption.getBoundingClientRect(), label = caption.firstElementChild.getBoundingClientRect(), link = caption.lastElementChild.getBoundingClientRect();
    if (Math.abs(label.left-bounds.left) > tolerance || Math.abs(bounds.right-link.right) > tolerance) errors.push('chart caption is not aligned to its edges');
    let previous = caption.previousElementSibling;
    while (previous && !visible(previous)) previous = previous.previousElementSibling;
    const gap = parseFloat(getComputedStyle(caption).getPropertyValue('--heading-gap'));
    if (previous && bounds.top - previous.getBoundingClientRect().bottom < gap - tolerance) errors.push('crowded chart caption');
  }
  for (const followup of document.querySelectorAll('.section-followup')) {
    if (!visible(followup)) continue;
    const bounds = followup.getBoundingClientRect();
    for (const child of followup.children) {
      const r = child.getBoundingClientRect();
      if (Math.abs((r.left+r.right-bounds.left-bounds.right)/2) > tolerance) errors.push('off-center section follow-up');
    }
    const cta = followup.querySelector('a');
    if (cta && !cta.matches('.button.button-soft')) errors.push('section follow-up missing shared CTA');
  }
  for (const phase of document.querySelectorAll('.chart-phases > div')) {
    if (visible(phase) && !phase.querySelector(':scope > .card-badge')) errors.push('chart phase missing shared badge');
  }
  // Decorative badges are aria-hidden, so test the visibility of their owner.
  // This geometry contract applies to every use of the shared badge primitive.
  for (const badge of document.querySelectorAll('.card-badge')) {
    const owner = badge.parentElement;
    if (!visible(owner)) continue;
    const a = badge.getBoundingClientRect(), b = owner.getBoundingClientRect();
    const label = owner.querySelector('.workflow-card-title,.centered-label-text');
    const position = getComputedStyle(badge).position;
    if (position === 'absolute' || position === 'fixed' || a.left < b.left-tolerance || a.right > b.right+tolerance || a.top < b.top-tolerance || a.bottom > b.bottom+tolerance) errors.push('misplaced card badge: ' + owner.className);
    if (Math.abs((a.left+a.right-b.left-b.right)/2) > tolerance) errors.push('misplaced card badge: ' + owner.className);
    if (label) {
      const t = label.getBoundingClientRect();
      if (Math.min(a.right,t.right)-Math.max(a.left,t.left) > tolerance && Math.min(a.bottom,t.bottom)-Math.max(a.top,t.top) > tolerance) errors.push('card badge overlaps title: ' + owner.className);
    }
    for (let parent = owner; parent; parent = parent.parentElement) {
      const s = getComputedStyle(parent), r = parent.getBoundingClientRect();
      if ((/hidden|clip|auto|scroll/.test(s.overflowY) && (a.top < r.top-tolerance || a.bottom > r.bottom+tolerance)) || (/hidden|clip|auto|scroll/.test(s.overflowX) && (a.left < r.left-tolerance || a.right > r.right+tolerance))) errors.push('clipped card badge: ' + owner.className);
    }
  }
  for (const label of document.querySelectorAll('.centered-label')) {
    if (!visible(label)) continue;
    const text = label.querySelector('.centered-label-text');
    if (!text) { errors.push('centered label missing text slot'); continue; }
    const a = text.getBoundingClientRect(), b = label.getBoundingClientRect();
    if (Math.abs((a.left + a.right - b.left - b.right) / 2) > tolerance) errors.push('off-center shared label: ' + text.textContent.trim());
    if (getComputedStyle(text).textAlign !== 'center') errors.push('shared label text alignment: ' + text.textContent.trim());
    const icon = label.querySelector('.centered-label-icon');
    if (icon && label.dataset.stacked === 'true') {
      const i = icon.getBoundingClientRect();
      if (Math.abs((i.left+i.right-b.left-b.right)/2) > tolerance || i.bottom > a.top + tolerance) errors.push('misplaced stacked label icon: ' + text.textContent.trim());
    }
  }
  for (const link of document.querySelectorAll('a.text-link')) {
    if (!visible(link)) continue;
    const s = getComputedStyle(link), gap = parseFloat(s.getPropertyValue('--space-2'));
    if (Math.abs(parseFloat(s.columnGap)-gap) > tolerance || s.justifyContent === 'space-between') errors.push('inconsistent action link spacing: ' + link.textContent.trim());
    const decorated = link.matches(':hover,:focus-visible');
    if (s.textDecorationLine !== (decorated ? 'underline' : 'none')) errors.push('inconsistent action link decoration: ' + link.textContent.trim());
  }
  return [...new Set(errors)];
}
