import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMemberService } from './project-member.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectRole } from 'prisma/generated/enums';

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
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMemberService,
        { provide: PrismaService, useValue: mockPrisma },
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
      mockPrisma.project.findUnique.mockResolvedValue({ id: 1, workspaceId: 1 });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.projectMember.create.mockResolvedValue({ id: 1, userId: 1, projectId: 1 });

      const result = await service.addMember(1, 1, ProjectRole.MEMBER);
      
      expect(result).toBeDefined();
      expect(mockPrisma.projectMember.create).toHaveBeenCalled();
    });
  });
});
