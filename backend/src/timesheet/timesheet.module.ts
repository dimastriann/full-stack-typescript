import { Module } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { TimesheetResolver } from './timesheet.resolver';

@Module({
  providers: [TimesheetResolver, TimesheetService],
})
export class TimesheetModule {}
