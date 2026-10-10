import { defineConfig, devices } from '@playwright/test';

/**
 * Opt-in E2E suite: services (PostgreSQL, Redis, backend, frontend) must be
 * running before tests start, or set E2E_AUTOSTART=1 to let Playwright spawn
 * the configured dev servers.
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const AUTOSTART = process.env.E2E_AUTOSTART === '1';

const webServers = AUTOSTART
  ? [
      {
        command: 'npm run dev --prefix ../frontend',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
      {
        command: 'npm run start:dev --prefix ../backend',
        url: `${process.env.E2E_API_URL ?? 'http://localhost:3000'}/health`,
        reuseExistingServer: true,
        timeout: 240_000,
      },
    ]
  : [];

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: webServers,
});
