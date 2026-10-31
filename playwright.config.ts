import { defineConfig } from '@playwright/test';

export default defineConfig({
 testDir: './tests/browser',
 /* A dedicated, serial test server prevents a stale developer Vite process or
    parallel browser workers from leaving the runner alive after a failure. */
 fullyParallel: false,
 workers: 1,
 reporter: 'list',
 timeout: 20_000,
 use: {
  baseURL: 'http://127.0.0.1:4174',
  browserName: 'chromium',
  headless: true,
 },
 webServer: {
  command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
  url: 'http://127.0.0.1:4174/tests/fixtures/visual-editor.html',
  reuseExistingServer: false,
  timeout: 30_000,
 },
});
