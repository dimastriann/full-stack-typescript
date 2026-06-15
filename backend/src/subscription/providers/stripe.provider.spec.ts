import { StripeProvider } from './stripe.provider';

// ── Stripe SDK mock ───────────────────────────────────────────────────────────
// The Stripe SDK uses a default export class — mock it manually so Jest doesn't
// try to use ESM interop (which breaks MockedClass casting).
const mockWebhooks = { constructEvent: jest.fn() };
const mockCustomers = { create: jest.fn() };
const mockCheckoutSessions = { create: jest.fn() };

jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      webhooks: mockWebhooks,
      customers: mockCustomers,
      checkout: { sessions: mockCheckoutSessions },
    })),
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildProvider(webhookSecret = 'whsec_test') {
  return new StripeProvider('sk_test_xxx', webhookSecret);
}

// Simulate a raw Stripe event body + reconstructed event
function makeStripeEvent(type: string, dataObject: unknown) {
  return { type, data: { object: dataObject } };
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('StripeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createCheckoutSession ─────────────────────────────────────────────────

  describe('createCheckoutSession()', () => {
    it('creates a new Stripe customer when providerCustomerId is absent', async () => {
      mockCustomers.create.mockResolvedValue({ id: 'cus_123' });
      mockCheckoutSessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/pay/cs_test',
        id: 'cs_001',
      });

      const provider = buildProvider();
      const result = await provider.createCheckoutSession({
        workspaceId: 1,
        planId: 'PRO',
        userEmail: 'user@test.com',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
      });

      expect(mockCustomers.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@test.com' }),
      );
      expect(result.checkoutUrl).toBe(
        'https://checkout.stripe.com/pay/cs_test',
      );
      expect(result.providerSessionId).toBe('cs_001');
    });

    it('reuses existing customer ID when providerCustomerId is supplied', async () => {
      mockCustomers.create.mockResolvedValue({});
      mockCheckoutSessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/pay/cs_002',
        id: 'cs_002',
      });

      const provider = buildProvider();
      await provider.createCheckoutSession({
        workspaceId: 2,
        planId: 'ENTERPRISE',
        userEmail: 'admin@test.com',
        providerCustomerId: 'cus_existing',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
      });

      expect(mockCustomers.create).not.toHaveBeenCalled();
      expect(mockCheckoutSessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_existing' }),
      );
    });
  });

  // ── constructWebhookEvent ─────────────────────────────────────────────────

  describe('constructWebhookEvent()', () => {
    const rawBody = Buffer.from('{}');
    const sig = 't=123,v1=abc';

    it('maps customer.subscription.updated (active) → subscription.activated', async () => {
      const stripeEvent = makeStripeEvent('customer.subscription.updated', {
        id: 'sub_001',
        status: 'active',
        customer: 'cus_111',
      });

      mockWebhooks.constructEvent.mockReturnValue(stripeEvent);

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(rawBody, sig);

      expect(event.type).toBe('subscription.activated');
      expect(event.providerSubscriptionId).toBe('sub_001');
      expect(event.providerCustomerId).toBe('cus_111');
    });

    it('maps customer.subscription.updated (past_due) → subscription.past_due', async () => {
      const stripeEvent = makeStripeEvent('customer.subscription.updated', {
        id: 'sub_002',
        status: 'past_due',
        customer: 'cus_222',
      });

      mockWebhooks.constructEvent.mockReturnValue(stripeEvent);

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(rawBody, sig);

      expect(event.type).toBe('subscription.past_due');
    });

    it('maps customer.subscription.deleted → subscription.canceled', async () => {
      const stripeEvent = makeStripeEvent('customer.subscription.deleted', {
        id: 'sub_003',
        status: 'canceled',
        customer: { id: 'cus_333' }, // customer as object
      });

      mockWebhooks.constructEvent.mockReturnValue(stripeEvent);

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(rawBody, sig);

      expect(event.type).toBe('subscription.canceled');
      expect(event.providerCustomerId).toBe('cus_333');
    });

    it('maps invoice.paid → payment.succeeded', async () => {
      const stripeEvent = makeStripeEvent('invoice.paid', {
        id: 'inv_001',
        subscription: 'sub_004',
        customer: 'cus_444',
      });

      mockWebhooks.constructEvent.mockReturnValue(stripeEvent);

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(rawBody, sig);

      expect(event.type).toBe('payment.succeeded');
      expect(event.providerSubscriptionId).toBe('sub_004');
    });

    it('maps unknown event type → unknown', async () => {
      const stripeEvent = makeStripeEvent('something.else', {});

      mockWebhooks.constructEvent.mockReturnValue(stripeEvent);

      const provider = buildProvider();
      const event = await provider.constructWebhookEvent(rawBody, sig);

      expect(event.type).toBe('unknown');
    });

    it('throws when signature verification fails', async () => {
      mockWebhooks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature');
      });

      const provider = buildProvider();

      await expect(
        provider.constructWebhookEvent(rawBody, 'bad_sig'),
      ).rejects.toThrow('Invalid Stripe webhook signature');
    });
  });
});
