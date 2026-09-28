import { test as base, expect } from '@playwright/test';

export { expect };
export const test = base.extend({
  runtimeHealth:[async ({page}, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Astro catches import/hydration failures and logs them; pageerror alone
    // misses those failures, leaving apparently healthy but inert SSR markup.
    page.on('console', message => {
      if (message.type() === 'error' && /astro-island|hydrat|Invalid hook|React error|dynamically imported module/i.test(message.text())) errors.push(message.text());
    });
    page.on('requestfailed', request => {
      if (request.resourceType() === 'script') errors.push(`${request.url()}: ${request.failure()?.errorText}`);
    });
    await use();
    expect(errors, 'No failed scripts, hydration errors or uncaught browser errors').toEqual([]);
  }, {auto:true}],
});
