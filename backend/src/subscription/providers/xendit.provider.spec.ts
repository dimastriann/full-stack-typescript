import { XenditProvider } from './xendit.provider';

// ── Mock xendit-node ──────────────────────────────────────────────────────────
jest.mock('xendit-node', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      Invoice: {
        createInvoice: jest.fn().mockResolvedValue({
          id: 'inv_xendit_001',
          invoiceUrl: 'https://checkout.xendit.co/web/inv_xendit_001',
        }),
      },
    })),
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_TOKEN = 'xendit-callback-token';

function buildProvider() {
  return new XenditProvider('sk_xendit_xxx', VALID_TOKEN);
}

function makeRawBody(payload: Record<string, unknown>): Buffer {
  return Buffer.from(JSON.stringify(payload));
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('XenditProvider', () => {
  // ── createCheckoutSession ─────────────────────────────────────────────────

  describe('createCheckoutSession()', () => {
    it('creates a Xendit invoice and returns checkout URL', async () => {
      const provider = buildProvider();
      const result = await provider.createCheckoutSession({
        workspaceId: 10,
        planId: 'PRO',
        userEmail: 'user@test.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
      });

      expect(result.checkoutUrl).toBe('https://checkout.xendit.co/web/inv_xendit_001');
      expect(result.providerSessionId).toBe('inv_xendit_001');
    });
  });

  // ── constructWebhookEvent ─────────────────────────────────────────────────

  describe('constructWebhookEvent()', () => {
    it('accepts a valid callback token and maps PAID → payment.succeeded', async () => {
      const provider = buildProvider();
      const rawBody = makeRawBody({
        status: 'PAID',
        external_id: 'ws-10-PRO-12345',
        payer_email: 'user@test.com',
      });

      const event = await provider.constructWebhookEvent(rawBody, VALID_TOKEN);

      expect(event.type).toBe('payment.succeeded');
      expect(event.providerSubscriptionId).toBe('ws-10-PRO-12345');
      expect(event.providerCustomerId).toBe('user@test.com');
    });

    it('maps EXPIRED status → subscription.canceled', async () => {
      const provider = buildProvider();
      const rawBody = makeRawBody({
        status: 'EXPIRED',
        external_id: 'ws-10-PRO-99999',
      });

      const event = await provider.constructWebhookEvent(rawBody, VALID_TOKEN);

      expect(event.type).toBe('subscription.canceled');
    });

    it('maps unknown status → unknown', async () => {
      const provider = buildProvider();
      const rawBody = makeRawBody({ status: 'PENDING', external_id: 'ws-10-PRO-77' });

      const event = await provider.constructWebhookEvent(rawBody, VALID_TOKEN);

      expect(event.type).toBe('unknown');
    });

    it('throws when callback token is invalid (timing-safe comparison)', async () => {
      const provider = buildProvider();
      const rawBody = makeRawBody({ status: 'PAID' });

      await expect(
        provider.constructWebhookEvent(rawBody, 'wrong-token'),
      ).rejects.toThrow('Invalid Xendit callback token');
    });

    it('throws when body is not valid JSON', async () => {
      const provider = buildProvider();
      const badBody = Buffer.from('not-json-at-all');

      await expect(
        provider.constructWebhookEvent(badBody, VALID_TOKEN),
      ).rejects.toThrow('Invalid Xendit webhook payload JSON');
    });
  });
});
