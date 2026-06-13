import { Injectable, Logger } from '@nestjs/common';
import { Snap, CoreApi } from 'midtrans-client';
import {
  PaymentProviderStrategy,
  CheckoutSession,
  CreateCheckoutParams,
  WebhookEvent,
} from './payment-provider.interface';

@Injectable()
export class MidtransProvider extends PaymentProviderStrategy {
  private readonly snap: Snap;
  private readonly coreApi: CoreApi;
  private readonly isProduction: boolean;
  private readonly logger = new Logger(MidtransProvider.name);

  constructor(serverKey: string, clientKey: string, isProduction = false) {
    super();
    const config = { isProduction, serverKey, clientKey };
    this.snap = new Snap(config);
    this.coreApi = new CoreApi(config);
    this.isProduction = isProduction;
  }

  async createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CheckoutSession> {
    const { workspaceId, planId, userEmail } = params;

    // Map plan to IDR amount
    const planAmounts: Record<string, number> = {
      PRO: 199000,
      ENTERPRISE: 999000,
      CUSTOM: 0,
    };

    const orderId = `ws-${workspaceId}-${planId}-${Date.now()}`;

    const transaction = await this.snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: planAmounts[planId] ?? 199000,
      },
      customer_details: {
        email: userEmail,
      },
      // Midtrans finish_redirect_url is set in the Midtrans dashboard per merchant
    });

    this.logger.log(
      `Midtrans Snap transaction created for workspace ${workspaceId}: ${orderId}`,
    );

    return {
      checkoutUrl: transaction.redirect_url,
      providerSessionId: orderId,
    };
  }

  async constructWebhookEvent(
    rawBody: Buffer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _signature: string, // Midtrans validates via CoreApi — signature header not needed
  ): Promise<WebhookEvent> {
    let notificationJson: Record<string, unknown>;
    try {
      notificationJson = JSON.parse(rawBody.toString('utf8')) as Record<
        string,
        unknown
      >;
    } catch {
      throw new Error('Invalid Midtrans notification payload JSON');
    }

    // Midtrans validates the notification via the CoreApi — signature key is embedded
    const notification =
      await this.coreApi.transaction.notification(notificationJson);

    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const orderId = notification.order_id;

    let type: WebhookEvent['type'] = 'unknown';

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (!fraudStatus || fraudStatus === 'accept') {
        type = 'payment.succeeded';
      }
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      type = 'subscription.canceled';
    }

    this.logger.log(
      `Midtrans notification processed: orderId=${orderId}, status=${transactionStatus}`,
    );

    return {
      type,
      providerSubscriptionId: orderId,
      raw: notificationJson,
    };
  }
}
