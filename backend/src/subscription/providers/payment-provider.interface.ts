/**
 * Describes the result of a checkout session creation.
 * The frontend should redirect the user to `checkoutUrl`.
 */
export interface CheckoutSession {
  /** URL to redirect the user to for payment */
  checkoutUrl: string;
  /** Provider-specific session/invoice ID */
  providerSessionId: string;
}

/**
 * Normalized webhook event returned after parsing a raw provider webhook.
 * All provider-specific details are mapped to this common shape.
 */
export interface WebhookEvent {
  type:
    | 'subscription.activated'
    | 'subscription.canceled'
    | 'subscription.past_due'
    | 'payment.succeeded'
    | 'unknown';
  /** Provider-specific subscription or invoice ID */
  providerSubscriptionId?: string;
  /** Provider-specific customer ID */
  providerCustomerId?: string;
  /** Raw event data from the provider for additional processing */
  raw: Record<string, unknown>;
}

export interface CreateCheckoutParams {
  workspaceId: number;
  planId: string; // 'PRO' | 'ENTERPRISE' | 'CUSTOM'
  /** Provider-specific customer ID if the customer already exists */
  providerCustomerId?: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Common interface every payment provider strategy must implement.
 * Adding a new provider = create a new class that implements this interface.
 */
export abstract class PaymentProviderStrategy {
  /**
   * Creates a hosted checkout session and returns the URL to redirect the user to.
   */
  abstract createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CheckoutSession>;

  /**
   * Parses and validates an incoming raw webhook payload from the provider.
   * Should throw if the signature is invalid.
   */
  abstract constructWebhookEvent(
    rawBody: Buffer,
    signature: string,
  ): Promise<WebhookEvent>;
}
