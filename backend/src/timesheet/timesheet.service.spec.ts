import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetService } from './timesheet.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';

const mockTimesheet = {
  id: 1,
  projectId: 1,
  userId: 1,
  hours: 8,
};

const mockPrisma = {
  timesheet: {
    create: jest.fn().mockResolvedValue(mockTimesheet),
    findMany: jest.fn().mockResolvedValue([mockTimesheet]),
    findUnique: jest.fn().mockResolvedValue(mockTimesheet),
    update: jest.fn().mockResolvedValue(mockTimesheet),
    delete: jest.fn().mockResolvedValue(mockTimesheet),
  },
};

const mockProjectMemberService = {
  checkPermission: jest.fn().mockResolvedValue(true),
  checkAccess: jest.fn().mockResolvedValue(true),
  getUserProjects: jest.fn().mockResolvedValue([{ projectId: 1 }]),
};

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
        hours: 8,
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
