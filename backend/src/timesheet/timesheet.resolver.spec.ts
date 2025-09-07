import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetResolver } from './timesheet.resolver';
import { TimesheetService } from './timesheet.service';

describe('TimesheetResolver', () => {
  let resolver: TimesheetResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimesheetResolver, TimesheetService],
    }).compile();

    resolver = module.get<TimesheetResolver>(TimesheetResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
