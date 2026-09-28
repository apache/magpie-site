import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// A busy port is an error: never attach to somebody else's preview.
export default defineConfig({
  testDir:'tests/dev', workers:1, timeout:120000, expect:{timeout:15000}, retries:0,
  outputDir:'.builds/dev-results', reporter:'list',
  use:{baseURL:'http://127.0.0.1:4399', browserName:'chromium', trace:'retain-on-failure'},
  webServer:{
    command:'npm run dev -- --ignore-lock --port 4399 --host 127.0.0.1',
    url:'http://127.0.0.1:4399', reuseExistingServer:false, timeout:120000,
    env:{ASTRO_DEV_BACKGROUND:'1', MAGPIE_CACHE_DIR:`node_modules/.cache/magpie-dev-${randomUUID()}`},
  },
});
