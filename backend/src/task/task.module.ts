import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskResolver } from './task.resolver';

import { ProjectMemberModule } from 'src/project-member/project-member.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [ProjectMemberModule, WebhookModule],
  providers: [TaskResolver, TaskService],
})
export class TaskModule {}
