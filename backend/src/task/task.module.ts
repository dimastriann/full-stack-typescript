import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskResolver } from './task.resolver';

import { ProjectMemberModule } from 'src/project-member/project-member.module';

@Module({
  imports: [ProjectMemberModule],
  providers: [TaskResolver, TaskService],
})
export class TaskModule {}
