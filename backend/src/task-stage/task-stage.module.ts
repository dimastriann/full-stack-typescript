import { Module } from '@nestjs/common';
import { TaskStageService } from './task-stage.service';
import { TaskStageResolver } from './task-stage.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TaskStageResolver, TaskStageService],
  exports: [TaskStageService],
})
export class TaskStageModule {}
