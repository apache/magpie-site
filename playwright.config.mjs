import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'tests/browser', fullyParallel:true, workers:4,
  timeout:120000, expect:{ timeout:8000 }, retries:0,
  outputDir:'.builds/test-results', reporter:[['list'], ['html', { outputFolder:'.builds/playwright-report', open:'never' }]],
  use:{ baseURL:process.env.MAGPIE_TEST_URL, browserName:'chromium', viewport:{ width:1280, height:900 }, reducedMotion:'reduce', trace:'retain-on-failure', screenshot:'only-on-failure' },
});
