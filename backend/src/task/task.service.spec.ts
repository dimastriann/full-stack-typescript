import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import { WebhookService } from 'src/webhook/webhook.service';

const mockTask = {
  id: 1,
  title: 'Test Task',
  projectId: 1,
  userId: 1,
  project: { workspaceId: 1 },
};

const mockPrisma = {
  taskStage: {
    findUnique: vi.fn(),
  },
  task: {
    create: vi.fn().mockResolvedValue(mockTask),
    findMany: vi.fn().mockResolvedValue([mockTask]),
    findUnique: vi.fn().mockResolvedValue(mockTask),
    update: vi.fn().mockResolvedValue(mockTask),
    delete: vi.fn().mockResolvedValue(mockTask),
  },
};

const mockProjectMemberService = {
  checkPermission: vi.fn().mockResolvedValue(true),
  checkAccess: vi.fn().mockResolvedValue(true),
  getUserProjects: vi.fn().mockResolvedValue([{ projectId: 1 }]),
};

const mockActivityLogService = { log: vi.fn().mockResolvedValue(undefined) };
const mockWebhookService = { trigger: vi.fn() };

describe('TaskService', () => {
  let service: TaskService;
  let prisma: PrismaService;
  let projectMemberService: ProjectMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ProjectMemberService,
          useValue: mockProjectMemberService,
        },
        { provide: ActivityLogService, useValue: mockActivityLogService },
        { provide: WebhookService, useValue: mockWebhookService },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    prisma = module.get<PrismaService>(PrismaService);
    projectMemberService =
      module.get<ProjectMemberService>(ProjectMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task with permission check', async () => {
      const createDto = {
        title: 'New Task',
        projectId: 1,
        stageId: 1,
      };

      const result = await service.create(createDto as any, 1);

      expect(result).toEqual(mockTask);
      expect(projectMemberService.checkPermission).toHaveBeenCalledWith(1, 1, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
        ProjectRole.MEMBER,
      ]);
      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tasks for accessible projects', async () => {
      const result = await service.findAll(1);
      expect(result).toEqual([mockTask]);
      expect(projectMemberService.getUserProjects).toHaveBeenCalledWith(1);
      expect(prisma.task.findMany).toHaveBeenCalled();
    });
  });
});
