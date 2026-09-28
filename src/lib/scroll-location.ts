/** Reflect the reading position without turning passive scrolling into navigation. */
export function trackScrollLocation() {
  const main = document.querySelector('main');
  if (!main) return;
  const sections = [...main.querySelectorAll<HTMLElement>('section[id]')].filter(section =>
    !section.matches('[role="tabpanel"]') && !section.parentElement?.closest('section[id]'));
  const anchors = main.querySelector('.docs-prose')
    ? [...main.querySelectorAll<HTMLElement>('.docs-prose :is(h2,h3)[id]')]
    : sections;
  if (!anchors.length) return;

  // Initial deep links, explicit navigation and history restoration own their
  // hash until the reader scrolls again. Layout shifts alone are not navigation.
  let reading = false;
  let scheduled = false;
  const resume = () => { reading = true; };
  const suspend = () => { reading = false; };
  window.addEventListener('wheel', resume, {passive:true});
  window.addEventListener('touchmove', resume, {passive:true});
  document.addEventListener('pointerdown', resume, {passive:true});
  document.addEventListener('keydown', event => {
    const target = event.target;
    if (target instanceof Element && target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) resume();
  });
  document.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('a[href]')) suspend();
  });
  window.addEventListener('hashchange', suspend);
  window.addEventListener('popstate', suspend);
  window.addEventListener('pageshow', suspend);

  window.addEventListener('scroll', () => {
    if (!reading || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (!reading) return;
      const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
      const readingLine = Math.max(0, headerBottom) + 24;
      let active: HTMLElement | undefined;
      for (const anchor of anchors) {
        if (window.scrollY > 0 && anchor.getClientRects().length && anchor.getBoundingClientRect().top <= readingLine) active = anchor;
      }
      const url = new URL(window.location.href);
      let target: HTMLElement | null = null;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { /* malformed fragment */ }
      // Keep a more precise deep link while still inside its owning section.
      if (active && target && active.contains(target)) return;
      const nextHash = active ? `#${active.id}` : '';
      if (url.hash === nextHash) return;
      url.hash = nextHash;
      history.replaceState(history.state, '', url);
    });
  }, {passive:true});
}
