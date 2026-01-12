import { Module } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { TimesheetResolver } from './timesheet.resolver';

import { ProjectMemberModule } from 'src/project-member/project-member.module';

@Module({
  imports: [ProjectMemberModule],
  providers: [TimesheetResolver, TimesheetService],
})
export class TimesheetModule {}
