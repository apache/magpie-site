import { chromium } from '@playwright/test';

// A fresh dev server optimises dependencies on the first page load and then
// forces a full reload. On a slow runner that reload can land after a test has
// seen hydration and started interacting, and silently throws the interaction
// away. Load each page the suite visits until it loads without a reload, so the
// optimiser has settled before the first test.
const PAGES = ['/', '/docs'];
const QUIET_MS = 3000;

export default async function warmUp(config) {
  const baseURL = config.projects[0].use.baseURL;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const path of PAGES) {
      for (let attempt = 1; ; attempt += 1) {
        let reloads = 0;
        const count = frame => { if (frame === page.mainFrame()) reloads += 1; };
        await page.goto(baseURL + path, { waitUntil: 'load', timeout: 120000 });
        page.on('framenavigated', count);
        await page.waitForTimeout(QUIET_MS);
        page.off('framenavigated', count);
        if (reloads === 0) { console.log(`warm-up: ${path} settled after ${attempt} load(s)`); break; }
        if (attempt === 5) throw new Error(`${path} kept reloading on the dev server`);
      }
    }
  } finally {
    await browser.close();
  }
}
