import { MidtransProvider } from './midtrans.provider';

// ── Mock midtrans-client ──────────────────────────────────────────────────────
const mockNotification = jest.fn();

jest.mock('midtrans-client', () => ({
  Snap: jest.fn().mockImplementation(() => ({
    createTransaction: jest.fn().mockResolvedValue({
      redirect_url: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/token123',
    }),
  })),
  CoreApi: jest.fn().mockImplementation(() => ({
    transaction: {
      notification: mockNotification,
    },
  })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildProvider() {
  return new MidtransProvider('server_key_test', 'client_key_test', false);
}

function makeRawBody(payload: Record<string, unknown>): Buffer {
  return Buffer.from(JSON.stringify(payload));
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('MidtransProvider', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── createCheckoutSession ─────────────────────────────────────────────────

  describe('createCheckoutSession()', () => {
    it('creates a Snap transaction and returns redirect URL', async () => {
      const provider = buildProvider();
      const result = await provider.createCheckoutSession({
        workspaceId: 20,
        planId: 'ENTERPRISE',
        userEmail: 'owner@test.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
      });

      expect(result.checkoutUrl).toBe(
        'https://app.sandbox.midtrans.com/snap/v2/vtweb/token123',
      );
      expect(result.providerSessionId).toMatch(/^ws-20-ENTERPRISE-/);
    });
  });

  // ── constructWebhookEvent ─────────────────────────────────────────────────

  describe('constructWebhookEvent()', () => {
    it('maps settlement + accept fraud → payment.succeeded', async () => {
      mockNotification.mockResolvedValue({
        transaction_status: 'settlement',
        fraud_status: 'accept',
        order_id: 'ws-20-ENTERPRISE-111',
      });

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(
        makeRawBody({ transaction_status: 'settlement' }),
        '',
      );

      expect(event.type).toBe('payment.succeeded');
      expect(event.providerSubscriptionId).toBe('ws-20-ENTERPRISE-111');
    });

    it('maps capture + accept → payment.succeeded', async () => {
      mockNotification.mockResolvedValue({
        transaction_status: 'capture',
        fraud_status: 'accept',
        order_id: 'ws-20-PRO-222',
      });

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(
        makeRawBody({ transaction_status: 'capture' }),
        '',
      );

      expect(event.type).toBe('payment.succeeded');
    });

    it('maps capture + challenge fraud → unknown (not accepted)', async () => {
      mockNotification.mockResolvedValue({
        transaction_status: 'capture',
        fraud_status: 'challenge',
        order_id: 'ws-20-PRO-333',
      });

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(
        makeRawBody({ transaction_status: 'capture' }),
        '',
      );

      expect(event.type).toBe('unknown');
    });

    it('maps cancel → subscription.canceled', async () => {
      mockNotification.mockResolvedValue({
        transaction_status: 'cancel',
        order_id: 'ws-20-PRO-444',
      });

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(
        makeRawBody({ transaction_status: 'cancel' }),
        '',
      );

      expect(event.type).toBe('subscription.canceled');
    });

    it('maps expire → subscription.canceled', async () => {
      mockNotification.mockResolvedValue({
        transaction_status: 'expire',
        order_id: 'ws-20-PRO-555',
      });

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(
        makeRawBody({ transaction_status: 'expire' }),
        '',
      );

      expect(event.type).toBe('subscription.canceled');
    });

    it('throws when raw body is not valid JSON', async () => {
      const provider = buildProvider();

      await expect(
        provider.constructWebhookEvent(Buffer.from('invalid-json'), ''),
      ).rejects.toThrow('Invalid Midtrans notification payload JSON');
    });
  });
});
