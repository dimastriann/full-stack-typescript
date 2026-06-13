import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './subscription.service';
import { JwtAuthRestGuard } from '../auth/guards/jwt-auth-rest.guard';
import { PlanLevel, PaymentProvider } from '../../prisma/generated/client';
import { Throttle } from '@nestjs/throttler';

interface CheckoutBody {
  planId: PlanLevel;
}

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * POST /subscription/checkout/:workspaceId
   * Creates a hosted checkout session via the configured default payment provider.
   * Returns { checkoutUrl } — frontend redirects the user there.
   */
  @Post('checkout/:workspaceId')
  @UseGuards(JwtAuthRestGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createCheckout(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() body: CheckoutBody,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number; email: string };
    const { planId } = body;

    if (!planId || !Object.values(PlanLevel).includes(planId)) {
      throw new BadRequestException('Invalid planId');
    }

    return this.subscriptionService.createCheckoutSession(
      workspaceId,
      planId,
      user.email,
    );
  }

  /**
   * POST /subscription/webhook/:provider
   * Receives raw webhook payloads from payment providers.
   * Raw body parsing is configured in main.ts so the signature can be verified.
   *
   * Stripe   → header: stripe-signature
   * Xendit   → header: x-callback-token
   * Midtrans → body-embedded notification hash
   */
  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') providerParam: string,
    @Req() req: Request,
    @Headers('stripe-signature') stripeSig: string,
    @Headers('x-callback-token') xenditToken: string,
  ) {
    const provider = providerParam.toUpperCase() as PaymentProvider;

    if (!Object.values(PaymentProvider).includes(provider)) {
      throw new BadRequestException(`Unknown provider: ${providerParam}`);
    }

    // Raw body is attached to req by the rawBodyMiddleware in main.ts
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body not available');
    }

    // Pick the right signature header per provider
    const signature =
      provider === PaymentProvider.STRIPE
        ? stripeSig
        : provider === PaymentProvider.XENDIT
          ? xenditToken
          : ''; // Midtrans validates internally via CoreApi

    return this.subscriptionService.handleWebhook(provider, rawBody, signature);
  }

  /**
   * GET /subscription/:workspaceId/limits
   * Returns the plan limits for a given workspace (used by frontend guards).
   */
  @Post(':workspaceId/limits')
  @UseGuards(JwtAuthRestGuard)
  async getLimits(@Param('workspaceId', ParseIntPipe) workspaceId: number) {
    return this.subscriptionService.getPlanLimits(workspaceId);
  }
}
