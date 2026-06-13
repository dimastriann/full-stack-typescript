import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  PaymentProviderStrategy,
  CheckoutSession,
  CreateCheckoutParams,
  WebhookEvent,
} from './payment-provider.interface';

// Stripe type shims for the installed SDK version
type StripeSubscription = {
  id: string;
  status: string;
  customer: string | { id: string };
};
type StripeInvoice = {
  id: string;
  subscription: string | null;
  customer: string | { id: string };
};
type StripeEvent = {
  type: string;
  data: { object: unknown };
};

@Injectable()
export class StripeProvider extends PaymentProviderStrategy {
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(StripeProvider.name);

  constructor(secretKey: string, webhookSecret: string) {
    super();
    // Use the latest API version supported by the installed SDK
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CheckoutSession> {
    const { userEmail, providerCustomerId, successUrl, cancelUrl, planId } =
      params;

    // Find or create Stripe customer
    let customerId = providerCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: userEmail,
        metadata: { workspaceId: String(params.workspaceId) },
      });
      customerId = customer.id;
    }

    // Map plan to Stripe price lookup key (configured in Stripe dashboard)
    const priceKey = `plan_${planId.toLowerCase()}_monthly`;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceKey, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        workspaceId: String(params.workspaceId),
        planId,
      },
      subscription_data: {
        metadata: {
          workspaceId: String(params.workspaceId),
          planId,
        },
      },
    });

    this.logger.log(
      `Stripe checkout session created for workspace ${params.workspaceId}`,
    );

    return {
      checkoutUrl: session.url!,
      providerSessionId: session.id,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async constructWebhookEvent(
    rawBody: Buffer,
    signature: string,
  ): Promise<WebhookEvent> {
    let event: StripeEvent;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      ) as unknown as StripeEvent;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Stripe webhook signature verification failed: ${msg}`);
      throw new Error(`Invalid Stripe webhook signature: ${msg}`);
    }

    const raw = event as unknown as Record<string, unknown>;

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as StripeSubscription;
        const status = sub.status;
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const type =
          status === 'active'
            ? 'subscription.activated'
            : status === 'past_due'
              ? 'subscription.past_due'
              : status === 'canceled'
                ? 'subscription.canceled'
                : 'unknown';
        return {
          type,
          providerSubscriptionId: sub.id,
          providerCustomerId: customerId,
          raw,
        };
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as StripeSubscription;
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        return {
          type: 'subscription.canceled',
          providerSubscriptionId: sub.id,
          providerCustomerId: customerId,
          raw,
        };
      }
      case 'invoice.paid': {
        const inv = event.data.object as StripeInvoice;
        const customerId =
          typeof inv.customer === 'string' ? inv.customer : inv.customer.id;
        return {
          type: 'payment.succeeded',
          providerSubscriptionId: inv.subscription ?? undefined,
          providerCustomerId: customerId,
          raw,
        };
      }
      default:
        return { type: 'unknown', raw };
    }
  }
}
