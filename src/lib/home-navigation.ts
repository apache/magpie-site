export function setupHomeNavigation() {
  const copyStatus = document.createElement('div');
  copyStatus.className = 'copy-link-status';
  copyStatus.setAttribute('role', 'status');
  document.body.append(copyStatus);
  let statusTimer: ReturnType<typeof setTimeout>;
  document.addEventListener('click', async event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('.section-heading > a[href]') : null;
    if (!link) return;
    // Keep the native hash navigation, query string, history and keyboard path.
    // Delegation includes headings mounted later by the React walkthroughs.
    try {
      await navigator.clipboard.writeText(link.href);
      copyStatus.textContent = 'Link copied';
    } catch {
      copyStatus.textContent = 'Copy the link from the address bar';
    }
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { copyStatus.textContent = ''; }, 2000);
  });
  const menu = document.querySelector<HTMLDetailsElement>('.home-navigation');
  if (!menu) return;
  const summary = menu.querySelector('summary');
  menu.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (!link) return;
    menu.open = false;
    if (event instanceof MouseEvent && (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    if (link.getAttribute('href')?.startsWith('#')) {
      const section = document.getElementById(link.hash.slice(1));
      section?.setAttribute('tabindex', '-1');
      section?.focus({preventScroll:true});
    }
  });
  document.addEventListener('click', event => {
    if (event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      summary?.focus({preventScroll:true});
    }
  });
}
