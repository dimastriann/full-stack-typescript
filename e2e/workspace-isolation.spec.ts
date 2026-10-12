import { expect, test, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_USER_EMAIL ?? 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'admin';
const DEMO_EMAIL = process.env.E2E_OTHER_USER_EMAIL ?? 'demo@gmail.com';
const DEMO_PASSWORD = process.env.E2E_OTHER_USER_PASSWORD ?? 'demo';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log ?in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

/** The workspace switcher exposes a hidden native select mirroring the Listbox state. */
async function createWorkspace(page: Page, name: string): Promise<void> {
  await page.locator('div.relative.w-48 select').first().selectOption('new', { force: true });
  await page.getByPlaceholder('My Awesome Team').fill(name);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
}

async function workspaceMembershipNames(page: Page): Promise<string[]> {
  const response = await page.request.post(`${API_URL}/graphql`, {
    data: {
      query: 'query { me { workspaceMembers { workspace { name } } } }',
    },
  });
  expect(response.ok()).toBe(true);
  const payload = (await response.json()) as {
    data?: { me?: { workspaceMembers?: Array<{ workspace?: { name?: string } }> } };
    errors?: Array<{ message: string }>;
  };
  expect(payload.errors).toBeUndefined();
  const members = payload.data?.me?.workspaceMembers ?? [];
  return members
    .map((member) => member.workspace?.name)
    .filter((name): name is string => Boolean(name));
}

test.describe('workspace isolation', () => {
  test('admin creates a workspace that demo never sees', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);

    const demoContext = await browser.newContext();
    const demoPage = await demoContext.newPage();
    await login(demoPage, DEMO_EMAIL, DEMO_PASSWORD);

    const workspaceName = `Isolation-${Date.now()}`;
    await createWorkspace(adminPage, workspaceName);
    expect(await workspaceMembershipNames(adminPage)).toContain(workspaceName);

    await demoPage.reload();
    await expect(demoPage.locator('button').filter({ hasText: workspaceName })).toHaveCount(0);
    expect(await workspaceMembershipNames(demoPage)).not.toContain(workspaceName);

    await adminContext.close();
    await demoContext.close();
  });

  test('demo cannot reach an admin workspace through the session api', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);

    const demoContext = await browser.newContext();
    const demoPage = await demoContext.newPage();
    await login(demoPage, DEMO_EMAIL, DEMO_PASSWORD);

    const workspaceName = `Isolation-${Date.now()}`;
    const createResponse = await adminContext.request.post(`${API_URL}/graphql`, {
      data: {
        query:
          'mutation ($input: CreateWorkspaceInput!) { createWorkspace(createWorkspaceInput: $input) { id name } }',
        variables: { input: { name: workspaceName, description: '' } },
      },
    });
    const created = (await createResponse.json()) as {
      errors?: Array<{ message: string }>;
      data?: { createWorkspace?: { name?: string } };
    };
    expect(created.errors).toBeUndefined();
    expect(created.data?.createWorkspace?.name).toBe(workspaceName);
    expect(await workspaceMembershipNames(adminPage)).toContain(workspaceName);

    expect(await workspaceMembershipNames(demoPage)).not.toContain(workspaceName);

    await adminContext.close();
    await demoContext.close();
  });
});
