import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '../../../prisma/generated/client';
import { PaymentProviderStrategy } from './payment-provider.interface';
import { StripeProvider } from './stripe.provider';
import { XenditProvider } from './xendit.provider';
import { MidtransProvider } from './midtrans.provider';

interface StoredProviderConfig {
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  xenditSecretKey?: string;
  xenditCallbackToken?: string;
  midtransServerKey?: string;
  midtransClientKey?: string;
  midtransIsProduction?: boolean;
}

/**
 * Reads the active DEFAULT PaymentProviderConfig from the database
 * and returns the corresponding provider strategy instance.
 *
 * Falls back to env vars if DB config keys are not set (useful during dev).
 */
@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getDefaultProvider(): Promise<PaymentProviderStrategy> {
    const config = await this.prisma.paymentProviderConfig.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!config) {
      throw new NotFoundException(
        'No active default payment provider configured. ' +
          'Go to Superadmin > Settings > Payments to configure one.',
      );
    }

    const stored = config.config as StoredProviderConfig;

    return this.buildProvider(config.provider, stored);
  }

  async getProvider(
    provider: PaymentProvider,
  ): Promise<PaymentProviderStrategy> {
    const config = await this.prisma.paymentProviderConfig.findUnique({
      where: { provider },
    });

    if (!config || !config.isActive) {
      throw new NotFoundException(
        `Payment provider ${provider} is not active or not configured.`,
      );
    }

    const stored = config.config as StoredProviderConfig;
    return this.buildProvider(provider, stored);
  }

  private buildProvider(
    provider: PaymentProvider,
    stored: StoredProviderConfig,
  ): PaymentProviderStrategy {
    switch (provider) {
      case PaymentProvider.STRIPE: {
        const secretKey =
          stored.stripeSecretKey ??
          this.configService.get<string>('STRIPE_SECRET_KEY') ??
          '';
        const webhookSecret =
          stored.stripeWebhookSecret ??
          this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ??
          '';
        this.logger.log('Using Stripe payment provider');
        return new StripeProvider(secretKey, webhookSecret);
      }

      case PaymentProvider.XENDIT: {
        const secretKey =
          stored.xenditSecretKey ??
          this.configService.get<string>('XENDIT_SECRET_KEY') ??
          '';
        const callbackToken =
          stored.xenditCallbackToken ??
          this.configService.get<string>('XENDIT_CALLBACK_TOKEN') ??
          '';
        this.logger.log('Using Xendit payment provider');
        return new XenditProvider(secretKey, callbackToken);
      }

      case PaymentProvider.MIDTRANS: {
        const serverKey =
          stored.midtransServerKey ??
          this.configService.get<string>('MIDTRANS_SERVER_KEY') ??
          '';
        const clientKey =
          stored.midtransClientKey ??
          this.configService.get<string>('MIDTRANS_CLIENT_KEY') ??
          '';
        const isProduction =
          stored.midtransIsProduction ??
          this.configService.get<string>('NODE_ENV') === 'production';
        this.logger.log('Using Midtrans payment provider');
        return new MidtransProvider(serverKey, clientKey, isProduction);
      }

      default:
        throw new NotFoundException(
          `Unsupported payment provider: ${String(provider)}`,
        );
    }
  }
}
