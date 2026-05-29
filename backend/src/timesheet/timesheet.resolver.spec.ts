import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetResolver } from './timesheet.resolver';
import { TimesheetService } from './timesheet.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';

describe('TimesheetResolver', () => {
  let resolver: TimesheetResolver;
  let service: TimesheetService;

  const mockTimesheetService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockPrismaService = {};
  const mockProjectMemberService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimesheetResolver,
        { provide: TimesheetService, useValue: mockTimesheetService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProjectMemberService, useValue: mockProjectMemberService },
      ],
    }).compile();

    resolver = module.get<TimesheetResolver>(TimesheetResolver);
    service = module.get<TimesheetService>(TimesheetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createTimesheet', () => {
    it('should call service with correct arguments', async () => {
      const input = {
        projectId: 1,
        taskId: 1,
        date: new Date().toISOString(),
        timeSpent: 2,
        description: 'Work',
      };
      const user = { id: 1 };
      mockTimesheetService.create.mockResolvedValue({
        id: 1,
        ...input,
        userId: 1,
      });

      await resolver.createTimesheet(input as any, user as any);

      expect(mockTimesheetService.create).toHaveBeenCalledWith(input, user.id);
    });
  });
});
