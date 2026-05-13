import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import { ForbiddenException } from '@nestjs/common';

const mockProject = {
  id: 1,
  name: 'Test Project',
  workspaceId: 1,
};

const mockPrisma = {
  project: {
    create: jest.fn().mockResolvedValue(mockProject),
    findMany: jest.fn().mockResolvedValue([mockProject]),
    findUnique: jest.fn().mockResolvedValue(mockProject),
    update: jest.fn().mockResolvedValue(mockProject),
    delete: jest.fn().mockResolvedValue(mockProject),
  },
  workspaceMember: {
    findUnique: jest.fn().mockResolvedValue({ workspaceId: 1, userId: 1 }),
  },
};

const mockProjectMemberService = {
  addMember: jest.fn().mockResolvedValue(true),
  checkAccess: jest.fn().mockResolvedValue(true),
  checkPermission: jest.fn().mockResolvedValue(true),
  getUserProjects: jest.fn().mockResolvedValue([{ projectId: 1 }]),
};

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
