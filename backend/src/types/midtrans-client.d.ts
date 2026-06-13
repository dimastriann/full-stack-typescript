// Minimal type declarations for midtrans-client (no official @types package)
declare module 'midtrans-client' {
  interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface CustomerDetails {
    email?: string;
    first_name?: string;
    last_name?: string;
  }

  interface SnapCreateParams {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    [key: string]: unknown;
  }

  interface SnapTransaction {
    token: string;
    redirect_url: string;
  }

  interface NotificationPayload {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    payment_type?: string;
    gross_amount?: string;
    [key: string]: unknown;
  }

  class Snap {
    constructor(config: MidtransConfig);
    createTransaction(params: SnapCreateParams): Promise<SnapTransaction>;
  }

  class CoreApi {
    constructor(config: MidtransConfig);
    transaction: {
      notification(
        notificationJson: Record<string, unknown>,
      ): Promise<NotificationPayload>;
    };
  }
}
