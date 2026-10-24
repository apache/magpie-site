import { test, expect } from '../browser/fixtures.mjs';
import { criticalProgressionTests } from '../browser/progression.mjs';
import { mobileExperienceTests } from '../browser/mobile.mjs';
import { measureLayout } from '../browser/layout.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';

criticalProgressionTests();
mobileExperienceTests();
// The first click after a load is setup, not what is tested here. On the dev
// server the island drops its ssr attribute before React handles events, so a
// click can land on the server-rendered button and do nothing: click until the
// choice takes. What survives the build is checked strictly below.
async function choose(dot) {
  await expect(async () => {
    await dot.click();
    await expect(dot).toHaveAttribute('aria-pressed','true',{timeout:1000});
  }).toPass();
}

test('development preview survives a production build without losing interactive state', async ({page}) => {
  const build = () => promisify(execFile)(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir',output], {env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},maxBuffer:4*1024*1024});
  const output = `.builds/dev-concurrency-${randomUUID()}`;
  await build();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(measureLayout)).toEqual([]);
  const dot = page.locator('.reel-dot').nth(2);
  await choose(dot);
  await page.evaluate(() => { window.previewState = 'survived'; });
  await build();
  expect(await page.evaluate(() => window.previewState)).toBe('survived');
  await expect.poll(() => page.evaluate(measureLayout)).toEqual([]);
  await expect(dot).toHaveAttribute('aria-pressed','true');
  await page.locator('.reel-dot').nth(3).click();
  await expect(page.locator('.reel-dot').nth(3)).toHaveAttribute('aria-pressed','true');
  await page.reload();
  await expect(page.locator('astro-island[ssr][client=load]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(measureLayout)).toEqual([]);
  await choose(page.locator('.reel-dot').nth(1));
});
