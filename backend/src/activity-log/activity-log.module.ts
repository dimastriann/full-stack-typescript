import { Module, Global } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogResolver } from './activity-log.resolver';

@Global()
@Module({
  providers: [ActivityLogResolver, ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
