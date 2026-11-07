import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import { ForbiddenException } from '@nestjs/common';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import { WebhookService } from 'src/webhook/webhook.service';

const mockProject = {
  id: 1,
  name: 'Test Project',
  workspaceId: 1,
};

const mockPrisma = {
  user: {
    findUnique: vi.fn().mockResolvedValue({ role: 'USER' }),
  },
  project: {
    create: vi.fn().mockResolvedValue(mockProject),
    findMany: vi.fn().mockResolvedValue([mockProject]),
    findUnique: vi.fn().mockResolvedValue(mockProject),
    findFirst: vi.fn().mockResolvedValue(mockProject),
    update: vi.fn().mockResolvedValue(mockProject),
    delete: vi.fn().mockResolvedValue(mockProject),
  },
  workspaceMember: {
    findUnique: vi.fn().mockResolvedValue({ workspaceId: 1, userId: 1 }),
  },
};

const mockProjectMemberService = {
  addMember: vi.fn().mockResolvedValue(true),
  checkAccess: vi.fn().mockResolvedValue(true),
  checkPermission: vi.fn().mockResolvedValue(true),
  getUserProjects: vi.fn().mockResolvedValue([{ projectId: 1 }]),
};

const mockActivityLogService = { log: vi.fn().mockResolvedValue(undefined) };
const mockWebhookService = { trigger: vi.fn() };

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: PrismaService;
  let projectMemberService: ProjectMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
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

    service = module.get<ProjectService>(ProjectService);
    prisma = module.get<PrismaService>(PrismaService);
    projectMemberService =
      module.get<ProjectMemberService>(ProjectMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project and add creator as OWNER if workspace member', async () => {
      const createDto = {
        name: 'New Project',
        workspaceId: 1,
      };

      const result = await service.create(createDto as any, 1);

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalled();
      expect(prisma.project.create).toHaveBeenCalled();
      expect(projectMemberService.addMember).toHaveBeenCalledWith(
        mockProject.id,
        1,
        ProjectRole.OWNER,
      );
      expect(result).toEqual(mockProject);
    });

    it('should throw ForbiddenException if user is not a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce(null);

      const createDto = {
        name: 'New Project',
        workspaceId: 2,
      };

      await expect(service.create(createDto as any, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should return projects where user is a member', async () => {
      const result = await service.findAll(1);
      expect(result).toEqual([mockProject]);
      expect(projectMemberService.getUserProjects).toHaveBeenCalledWith(1);
    });
  });
});
