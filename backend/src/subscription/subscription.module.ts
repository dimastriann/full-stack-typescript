import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { PlanLimitGuard } from './guards/plan-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    PaymentProviderFactory,
    PlanLimitGuard,
    Reflector,
  ],
  exports: [SubscriptionService, PlanLimitGuard],
})
export class SubscriptionModule {}
