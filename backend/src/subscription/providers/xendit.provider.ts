import { Injectable, Logger } from '@nestjs/common';
import Xendit from 'xendit-node';
import {
  PaymentProviderStrategy,
  CheckoutSession,
  CreateCheckoutParams,
  WebhookEvent,
} from './payment-provider.interface';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class XenditProvider extends PaymentProviderStrategy {
  private readonly client: Xendit;
  private readonly callbackToken: string;
  private readonly logger = new Logger(XenditProvider.name);

  constructor(secretKey: string, callbackToken: string) {
    super();
    // xendit-node v6: pass secretKey to the Xendit class, sub-APIs are properties
    this.client = new Xendit({ secretKey });
    this.callbackToken = callbackToken;
  }

  async createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CheckoutSession> {
    const { workspaceId, planId, userEmail, successUrl, cancelUrl } = params;

    // Map plan to a fixed IDR amount — in production comes from PlanFeatureLimit
    const planAmounts: Record<string, number> = {
      PRO: 199000,
      ENTERPRISE: 999000,
      CUSTOM: 0,
    };

    const externalId = `ws-${workspaceId}-${planId}-${Date.now()}`;

    // xendit-node v6: this.client.Invoice is an InvoiceApi instance (not a constructor)
    const invoice = await this.client.Invoice.createInvoice({
      data: {
        externalId,
        amount: planAmounts[planId] ?? 199000,
        payerEmail: userEmail,
        description: `${planId} Plan subscription for workspace ${workspaceId}`,
        successRedirectUrl: successUrl,
        failureRedirectUrl: cancelUrl,
        currency: 'IDR',
      },
    });

    this.logger.log(
      `Xendit invoice created for workspace ${workspaceId}: ${invoice.id}`,
    );

    return {
      checkoutUrl: invoice.invoiceUrl ?? '',
      providerSessionId: invoice.id ?? externalId,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async constructWebhookEvent(
    rawBody: Buffer,
    signature: string,
  ): Promise<WebhookEvent> {
    // Xendit uses a callback token in the x-callback-token header
    const expectedToken = Buffer.from(this.callbackToken);
    const receivedToken = Buffer.from(signature);

    const isValid =
      expectedToken.length === receivedToken.length &&
      timingSafeEqual(expectedToken, receivedToken);

    if (!isValid) {
      this.logger.error('Xendit webhook callback token verification failed');
      throw new Error('Invalid Xendit callback token');
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
    } catch {
      throw new Error('Invalid Xendit webhook payload JSON');
    }

    const status = payload['status'] as string | undefined;
    const externalId = payload['external_id'] as string | undefined;

    let type: WebhookEvent['type'] = 'unknown';
    if (status === 'PAID') type = 'payment.succeeded';
    else if (status === 'EXPIRED') type = 'subscription.canceled';

    return {
      type,
      providerSubscriptionId: externalId,
      providerCustomerId: payload['payer_email'] as string | undefined,
      raw: payload,
    };
  }
}
