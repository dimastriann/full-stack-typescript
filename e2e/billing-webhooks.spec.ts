import { createHmac } from 'node:crypto';
import {
  expect,
  request as newRequest,
  test,
  type APIRequestContext,
} from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';
const USER_EMAIL = process.env.E2E_USER_EMAIL ?? 'admin@gmail.com';
const USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'admin';
const SUPERADMIN_EMAIL =
  process.env.E2E_SUPERADMIN_EMAIL ?? 'superadmin@e2e.test';
const SUPERADMIN_PASSWORD =
  process.env.E2E_SUPERADMIN_PASSWORD ?? 'e2e-super-secret-123';
const STRIPE_WEBHOOK_SECRET = 'whsec_e2e_billing_suite';
const XENDIT_CALLBACK_TOKEN = 'xnd_e2e_callback_token';

async function login(
  api: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  const response = await api.post('/graphql', {
    data: {
      query:
        'mutation ($email: String!, $password: String!) { login(email: $email, password: $password) { access_token } }',
      variables: { email, password },
    },
  });
  expect(response.ok()).toBe(true);
  const payload = (await response.json()) as {
    errors?: Array<{ message: string }>;
  };
  expect(payload.errors).toBeUndefined();
}

async function configureProvider(
  api: APIRequestContext,
  provider: string,
  config: Record<string, string>,
  isActive = true,
): Promise<void> {
  const response = await api.put(`/superadmin/payment-providers/${provider}`, {
    data: { config, isDefault: isActive, isActive },
  });
  expect(
    response.ok(),
    `configuring ${provider} failed: ${await response.text()}`,
  ).toBe(true);
}

async function firstWorkspaceId(api: APIRequestContext): Promise<number> {
  const response = await api.post('/graphql', {
    data: { query: 'query { me { workspaceMembers { workspace { id } } } }' },
  });
  expect(response.ok()).toBe(true);
  const payload = (await response.json()) as {
    data?: {
      me?: { workspaceMembers?: Array<{ workspace?: { id?: number } }> };
    };
    errors?: Array<{ message: string }>;
  };
  expect(payload.errors).toBeUndefined();
  const id = payload.data?.me?.workspaceMembers?.[0]?.workspace?.id;
  expect(id).toBeGreaterThan(0);
  return id as number;
}

function stripeSignature(
  rawBody: string,
  secret = STRIPE_WEBHOOK_SECRET,
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

interface ProviderConfigRow {
  provider: string;
  isActive: boolean;
  config?: Record<string, unknown>;
}

/** Rows whose config was cleared are leftovers from earlier suite runs. */
function isSuiteOwned(row: ProviderConfigRow | undefined): boolean {
  return Boolean(row) && Object.keys(row?.config ?? {}).length === 0;
}

test.describe('billing and payment webhooks', () => {
  let superApi: APIRequestContext;
  let userApi: APIRequestContext;
  let stripeActive = false;
  let stripeSecretKnown = false;
  let xenditActive = false;
  let stripeManaged = false;
  let xenditManaged = false;

  test.beforeAll(async () => {
    superApi = await newRequest.newContext({ baseURL: API_URL });
    await login(superApi, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);

    const configsResponse = await superApi.get('/superadmin/payment-providers');
    expect(configsResponse.ok()).toBe(true);
    const existing = (await configsResponse.json()) as ProviderConfigRow[];

    const existingStripe = existing.find((row) => row.provider === 'STRIPE');
    if (!existingStripe || isSuiteOwned(existingStripe)) {
      await configureProvider(superApi, 'STRIPE', {
        stripeSecretKey: 'sk_test_e2e_placeholder',
        stripeWebhookSecret: STRIPE_WEBHOOK_SECRET,
      });
      stripeManaged = true;
      stripeActive = true;
      stripeSecretKnown = true;
    } else {
      stripeActive = existingStripe.isActive;
    }

    const existingXendit = existing.find((row) => row.provider === 'XENDIT');
    if (!existingXendit || isSuiteOwned(existingXendit)) {
      await configureProvider(superApi, 'XENDIT', {
        xenditSecretKey: 'xnd_test_e2e_placeholder',
        xenditCallbackToken: XENDIT_CALLBACK_TOKEN,
      });
      xenditManaged = true;
      xenditActive = true;
    } else {
      xenditActive = existingXendit.isActive;
    }

    userApi = await newRequest.newContext({ baseURL: API_URL });
    await login(userApi, USER_EMAIL, USER_PASSWORD);
  });

  test.afterAll(async () => {
    if (stripeManaged) {
      await configureProvider(superApi, 'STRIPE', {}, false);
    }
    if (xenditManaged) {
      await configureProvider(superApi, 'XENDIT', {}, false);
    }
    await superApi.dispose();
    await userApi.dispose();
  });

  test('rejects unauthenticated checkout requests', async () => {
    const anonymous = await newRequest.newContext({ baseURL: API_URL });
    try {
      const response = await anonymous.post('/subscription/checkout/1', {
        data: { planId: 'PRO' },
      });
      expect(response.status()).toBe(401);
    } finally {
      await anonymous.dispose();
    }
  });

  test('rejects checkout for a workspace the caller does not belong to', async () => {
    const response = await userApi.post('/subscription/checkout/999999999', {
      data: { planId: 'PRO' },
    });

    expect([403, 404]).toContain(response.status());
  });

  test('rejects unknown plan ids before contacting the provider', async () => {
    const workspaceId = await firstWorkspaceId(userApi);

    const response = await userApi.post(
      `/subscription/checkout/${workspaceId}`,
      { data: { planId: 'NOT_A_PLAN' } },
    );

    expect(response.status()).toBe(400);
    expect(await response.text()).toContain('Invalid planId');
  });

  test('rejects unknown payment providers', async () => {
    const response = await userApi.post('/subscription/webhook/not_a_provider', {
      data: { hello: 'world' },
    });

    expect(response.status()).toBe(400);
    expect(await response.text()).toContain('Unknown provider');
  });

  test('rejects Stripe webhooks that are unsigned or forged', async () => {
    test.skip(
      !stripeActive,
      'Stripe provider is not active in this environment',
    );
    const payload = JSON.stringify({
      id: 'evt_e2e_1',
      type: 'customer.created',
    });

    const unsigned = await userApi.post('/subscription/webhook/stripe', {
      headers: { 'content-type': 'application/json' },
      data: payload,
    });
    expect(unsigned.status(), await unsigned.text()).toBe(400);

    const forged = await userApi.post('/subscription/webhook/stripe', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': stripeSignature(payload, 'whsec_wrong_secret'),
      },
      data: payload,
    });
    const forgedBody = await forged.text();
    expect(forged.status(), forgedBody).toBe(400);
    expect(forgedBody).toContain('Invalid Stripe webhook signature');
  });

  test('accepts a correctly signed Stripe webhook', async () => {
    test.skip(
      !(stripeActive && stripeSecretKnown),
      'Requires the provider secret configured by this suite',
    );
    const payload = JSON.stringify({
      id: 'evt_e2e_unknown_type',
      object: 'event',
      type: 'customer.created',
      data: { object: { id: 'cus_e2e' } },
    });

    const response = await userApi.post('/subscription/webhook/stripe', {
      headers: {
        'content-type': 'application/json',
        'stripe-signature': stripeSignature(payload),
      },
      data: payload,
    });

    const body = await response.text();
    expect(response.status(), body).toBe(200);
    expect(JSON.parse(body)).toEqual({ received: true });
  });

  test('rejects Xendit webhooks with the wrong callback token', async () => {
    test.skip(
      !xenditActive,
      'Xendit provider is not active in this environment',
    );
    const response = await userApi.post('/subscription/webhook/xendit', {
      headers: { 'x-callback-token': 'wrong-token' },
      data: { status: 'PAID', external_id: 'inv_e2e' },
    });

    expect(response.status()).toBe(400);
    expect(await response.text()).toContain('Invalid Xendit callback token');
  });
});
