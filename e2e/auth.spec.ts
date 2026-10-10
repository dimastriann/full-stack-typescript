import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_USER_EMAIL ?? 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'admin';

test.describe('authentication journey', () => {
  test('rejects wrong credentials with an error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('nobody@example.com');
    await page.getByLabel(/password/i).fill('definitely-wrong');
    await page.getByRole('button', { name: /sign in|log ?in/i }).click();

    const error = page.locator('[role="alert"], .text-red-500, .text-red-600').first();
    await expect(error).toBeVisible({ timeout: 15_000 });
  });

  test('logs in a seeded account and lands on the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in|log ?in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });

  test('keeps the session alive across reloads', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in|log ?in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('logs out and returns to the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in|log ?in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await page.getByRole('button', { name: /log ?out|sign out/i }).first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });
});
