import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectResolver } from './project.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProjectMemberModule } from 'src/project-member/project-member.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [
    PrismaModule,
    ProjectMemberModule,
    SubscriptionModule,
    WebhookModule,
  ],
  providers: [ProjectResolver, ProjectService],
})
export class ProjectModule {}
