import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMemberService } from './project-member.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectRole } from 'prisma/generated/enums';
import { ForbiddenException } from '@nestjs/common';
import { ActivityLogService } from 'src/activity-log/activity-log.service';

describe('ProjectMemberService', () => {
  let service: ProjectMemberService;
  let prisma: PrismaService;

  const mockPrisma = {
    projectMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn().mockResolvedValue({ userId: 1 }),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMemberService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ActivityLogService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<ProjectMemberService>(ProjectMemberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addMember', () => {
    it('should add a member successfully', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 1,
        workspaceId: 1,
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ userId: 1 });
      mockPrisma.projectMember.create.mockResolvedValue({
        id: 1,
        userId: 1,
        projectId: 1,
      });

      const result = await service.addMember(1, 1, ProjectRole.MEMBER);

      expect(result).toBeDefined();
      expect(mockPrisma.projectMember.create).toHaveBeenCalled();
    });

    it('rejects users who are not workspace members', async () => {
      mockPrisma.projectMember.findUnique.mockResolvedValue(null);
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 1,
        workspaceId: 1,
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.addMember(1, 7, ProjectRole.MEMBER)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.projectMember.create).not.toHaveBeenCalled();
    });
  });
});
