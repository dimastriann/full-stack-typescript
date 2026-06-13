import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import {
  PaymentProvider,
  PlanLevel,
  SubscriptionStatus,
} from '../../prisma/generated/client';
import { CreateCheckoutParams } from './providers/payment-provider.interface';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  // ─── Checkout ──────────────────────────────────────────────────────────────

  async createCheckoutSession(
    workspaceId: number,
    planId: PlanLevel,
    userEmail: string,
  ) {
    if (planId === PlanLevel.FREE) {
      throw new BadRequestException(
        'Cannot create a checkout session for the FREE plan.',
      );
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    const provider = await this.providerFactory.getDefaultProvider();

    // Get existing provider customer ID if the workspace already has a subscription
    const existing = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });

    const params: CreateCheckoutParams = {
      workspaceId,
      planId,
      userEmail,
      providerCustomerId: existing?.providerCustomerId ?? undefined,
      successUrl: `${frontendUrl}/workspace/${workspaceId}/subscription/success`,
      cancelUrl: `${frontendUrl}/pricing`,
    };

    const session = await provider.createCheckoutSession(params);

    this.logger.log(
      `Checkout session created for workspace ${workspaceId}, plan ${planId}`,
    );

    return session;
  }

  // ─── Webhook handler ───────────────────────────────────────────────────────

  async handleWebhook(
    provider: PaymentProvider,
    rawBody: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    const providerStrategy = await this.providerFactory.getProvider(provider);
    const event = await providerStrategy.constructWebhookEvent(
      rawBody,
      signature,
    );

    this.logger.log(`Webhook received [${provider}]: type=${event.type}`);

    switch (event.type) {
      case 'subscription.activated':
      case 'payment.succeeded':
        await this._activateSubscription(
          provider,
          event.providerSubscriptionId,
          event.providerCustomerId,
        );
        break;

      case 'subscription.canceled':
        await this._cancelSubscription(provider, event.providerSubscriptionId);
        break;

      case 'subscription.past_due':
        await this._markPastDue(provider, event.providerSubscriptionId);
        break;

      case 'unknown':
      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
    }

    return { received: true };
  }

  // ─── Subscription state helpers ────────────────────────────────────────────

  private async _activateSubscription(
    provider: PaymentProvider,
    providerSubscriptionId?: string,
    providerCustomerId?: string,
  ) {
    if (!providerSubscriptionId) return;

    await this.prisma.subscription.updateMany({
      where: { providerSubscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        provider,
        providerCustomerId,
        cancelAtPeriodEnd: false,
      },
    });
    this.logger.log(
      `Subscription activated: ${providerSubscriptionId} via ${provider}`,
    );
  }

  private async _cancelSubscription(
    provider: PaymentProvider,
    providerSubscriptionId?: string,
  ) {
    if (!providerSubscriptionId) return;

    await this.prisma.subscription.updateMany({
      where: { providerSubscriptionId },
      data: { status: SubscriptionStatus.CANCELED, cancelAtPeriodEnd: true },
    });
    this.logger.log(
      `Subscription canceled: ${providerSubscriptionId} via ${provider}`,
    );
  }

  private async _markPastDue(
    provider: PaymentProvider,
    providerSubscriptionId?: string,
  ) {
    if (!providerSubscriptionId) return;

    await this.prisma.subscription.updateMany({
      where: { providerSubscriptionId },
      data: { status: SubscriptionStatus.PAST_DUE },
    });
    this.logger.log(
      `Subscription past due: ${providerSubscriptionId} via ${provider}`,
    );
  }

  // ─── Plan limit checks (used by feature guards) ─────────────────────────────

  async getPlanLimits(workspaceId: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });

    const planLevel = subscription?.planLevel ?? PlanLevel.FREE;

    // CUSTOM plan may have per-workspace overrides in subscription.customLimits
    if (planLevel === PlanLevel.CUSTOM && subscription?.customLimits) {
      return subscription.customLimits as {
        maxProjects: number;
        maxMembers: number;
        maxStorageGb: number;
      };
    }

    const limits = await this.prisma.planFeatureLimit.findUnique({
      where: { planLevel },
    });

    if (!limits) {
      // Fallback to free tier if limits table is not seeded
      return { maxProjects: 5, maxMembers: 10, maxStorageGb: 2 };
    }

    return {
      maxProjects: limits.maxProjects,
      maxMembers: limits.maxMembers,
      maxStorageGb: limits.maxStorageGb,
    };
  }

  async getWorkspaceSubscription(workspaceId: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });
    return (
      sub ?? { planLevel: PlanLevel.FREE, status: SubscriptionStatus.ACTIVE }
    );
  }

  // ─── Used by plan limit guard to enforce project count ─────────────────────

  async checkProjectLimit(workspaceId: number): Promise<void> {
    const limits = await this.getPlanLimits(workspaceId);
    if (limits.maxProjects === -1) return; // unlimited

    const count = await this.prisma.project.count({ where: { workspaceId } });
    if (count >= limits.maxProjects) {
      throw new BadRequestException({
        code: 'PLAN_LIMIT_EXCEEDED',
        message: `Your plan allows a maximum of ${limits.maxProjects} projects. Upgrade to create more.`,
        limit: limits.maxProjects,
        current: count,
      });
    }
  }

  async checkMemberLimit(workspaceId: number): Promise<void> {
    const limits = await this.getPlanLimits(workspaceId);
    if (limits.maxMembers === -1) return; // unlimited

    const count = await this.prisma.workspaceMember.count({
      where: { workspaceId },
    });
    if (count >= limits.maxMembers) {
      throw new BadRequestException({
        code: 'PLAN_LIMIT_EXCEEDED',
        message: `Your plan allows a maximum of ${limits.maxMembers} members. Upgrade to add more.`,
        limit: limits.maxMembers,
        current: count,
      });
    }
  }
}
