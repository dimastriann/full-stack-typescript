import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WebhookService } from './webhook.service';
import {
  WebhookResolver,
  WebhookDeliveryLogResolver,
} from './webhook.resolver';

@Module({
  imports: [PrismaModule],
  providers: [WebhookService, WebhookResolver, WebhookDeliveryLogResolver],
  exports: [WebhookService],
})
export class WebhookModule {}
