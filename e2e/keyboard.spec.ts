import { expect, test, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_USER_EMAIL ?? 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'admin';

async function focusByTab(page: Page, selector: string, maxTabs = 40): Promise<void> {
  const chain: string[] = [];
  for (let i = 0; i < maxTabs; i += 1) {
    const matches = await page.evaluate(
      (target) => document.activeElement?.matches(target) ?? false,
      selector,
    );
    if (matches) return;
    const description = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return 'none';
      const tag = el.tagName.toLowerCase();
      const id = (el as HTMLElement).id;
      const aria = el.getAttribute('aria-label') ?? '';
      return `${tag}${id ? `#${id}` : ''}${aria ? `[${aria}]` : ''}`;
    });
    chain.push(description);
    await page.keyboard.press('Tab');
  }
  throw new Error(
    `Could not focus ${selector} with Tab. Focus chain: ${chain.join(' -> ')}`,
  );
}

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in|log ?in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

function workspaceSwitcher(page: Page) {
  return page.locator('button[aria-haspopup="listbox"]').first();
}

test.describe('keyboard workflows', () => {
  test('signs in using only the keyboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('heading', { name: /welcome back/i }).waitFor();
    await page.getByLabel(/email/i).waitFor();

    await focusByTab(page, '#email-address');
    await page.keyboard.type(ADMIN_EMAIL);
    await page.keyboard.press('Tab');
    await focusByTab(page, '#password');
    await page.keyboard.type(ADMIN_PASSWORD);
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });

  test('opens the workspace switcher with the keyboard and closes it with Escape', async ({ page }) => {
    await login(page);

    const switcher = workspaceSwitcher(page);
    await switcher.focus();
    // ARIA listbox pattern: Down Arrow opens the popup and focuses options.
    await page.keyboard.press('ArrowDown');

    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
  });

  test('reaches the create-workspace dialog by keyboard and dismisses it with Escape', async ({ page }) => {
    await login(page);

    const switcher = workspaceSwitcher(page);
    await switcher.focus();
    // ArrowUp opens on the current selection; End jumps to the last option,
    // which is the create-workspace entry.
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');

    const nameInput = page.getByPlaceholder('My Awesome Team');
    await expect(nameInput).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nameInput).toBeHidden();
  });
});
