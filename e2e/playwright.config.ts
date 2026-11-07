import { defineConfig, devices } from '@playwright/test';

/**
 * Opt-in E2E suite: services (PostgreSQL, Redis, backend, frontend) must be
 * running before tests start, or set E2E_AUTOSTART=1 to let Playwright spawn
 * the configured dev servers. E2E_API_URL can point the suite at a backend on
 * a non-default port (the frontend is spawned against the same URL).
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';
const API_PORT = new URL(API_URL).port || '3000';
const AUTOSTART = process.env.E2E_AUTOSTART === '1';

const webServers = AUTOSTART
  ? [
      {
        command: 'npm run dev --prefix ../frontend',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          ...process.env,
          VITE_API_URL: `${API_URL}/graphql`,
          VITE_DEVELOPMENT: 'true',
        },
      },
      {
        command: 'npm run start:dev --prefix ../backend',
        url: `${API_URL}/health`,
        reuseExistingServer: true,
        timeout: 240_000,
        stdout: 'pipe',
        stderr: 'pipe',
        // The suite performs many authenticated requests across test contexts;
        // keeping the production default would surface fake auth failures.
        env: {
          ...process.env,
          PORT: API_PORT,
          THROTTLE_LIMIT: String(Number(process.env.E2E_THROTTLE_LIMIT ?? 1000)),
          THROTTLE_LOGIN_LIMIT: String(Number(process.env.E2E_THROTTLE_LIMIT ?? 1000)),
          THROTTLE_REGISTER_LIMIT: String(Number(process.env.E2E_THROTTLE_LIMIT ?? 1000)),
          THROTTLE_REFRESH_LIMIT: String(Number(process.env.E2E_THROTTLE_LIMIT ?? 1000)),
          THROTTLE_2FA_LIMIT: String(Number(process.env.E2E_THROTTLE_LIMIT ?? 1000)),
          THROTTLE_TTL_MS: '60000',
        },
      },
    ]
  : [];

export default defineConfig({
  testDir: '.',
  // The backend throttles at 100 requests/minute per client IP; parallel
  // browser sessions would exhaust that budget and surface fake auth errors.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: webServers,
});
