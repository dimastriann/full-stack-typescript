import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetService } from './timesheet.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import { ActivityLogService } from 'src/activity-log/activity-log.service';

const mockTimesheet = {
  id: 1,
  projectId: 1,
  userId: 1,
  timeSpent: 8,
  description: 'Working on task',
  project: { workspaceId: 1 },
};

const mockPrisma = {
  timesheet: {
    create: vi.fn().mockResolvedValue(mockTimesheet),
    findMany: vi.fn().mockResolvedValue([mockTimesheet]),
    findUnique: vi.fn().mockResolvedValue(mockTimesheet),
    update: vi.fn().mockResolvedValue(mockTimesheet),
    delete: vi.fn().mockResolvedValue(mockTimesheet),
  },
};

const mockProjectMemberService = {
  checkPermission: vi.fn().mockResolvedValue(true),
  checkAccess: vi.fn().mockResolvedValue(true),
  getUserProjects: vi.fn().mockResolvedValue([{ projectId: 1 }]),
};

const mockActivityLogService = { log: vi.fn().mockResolvedValue(undefined) };

describe('TimesheetService', () => {
  let service: TimesheetService;
  let prisma: PrismaService;
  let projectMemberService: ProjectMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimesheetService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ProjectMemberService,
          useValue: mockProjectMemberService,
        },
        { provide: ActivityLogService, useValue: mockActivityLogService },
      ],
    }).compile();

    service = module.get<TimesheetService>(TimesheetService);
    prisma = module.get<PrismaService>(PrismaService);
    projectMemberService =
      module.get<ProjectMemberService>(ProjectMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a timesheet with project permission check', async () => {
      const createDto = {
        projectId: 1,
        taskId: 1,
        timeSpent: 8,
        description: 'Working on task',
      };

      const result = await service.create(createDto as any, 1);

      expect(result).toEqual(mockTimesheet);
      expect(projectMemberService.checkPermission).toHaveBeenCalledWith(1, 1, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
        ProjectRole.MEMBER,
      ]);
      expect(prisma.timesheet.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return timesheets for accessible projects', async () => {
      const result = await service.findAll(1);
      expect(result).toEqual([mockTimesheet]);
      expect(projectMemberService.getUserProjects).toHaveBeenCalledWith(1);
    });
  });
});
