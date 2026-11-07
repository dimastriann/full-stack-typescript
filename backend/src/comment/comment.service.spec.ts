import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';

describe('CommentService', () => {
  let service: CommentService;
  let prisma: PrismaService;
  let projectMemberService: ProjectMemberService;

  const mockPrisma = {
    comment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
    },
  };

  const mockProjectMemberService = {
    checkPermission: vi.fn(),
    checkAccess: vi.fn(),
    getUserProjects: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProjectMemberService, useValue: mockProjectMemberService },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    prisma = module.get<PrismaService>(PrismaService);
    projectMemberService =
      module.get<ProjectMemberService>(ProjectMemberService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      const input = { content: 'Test comment', projectId: 1, userId: 1 };
      mockProjectMemberService.checkPermission.mockResolvedValue(true);
      mockPrisma.comment.create.mockResolvedValue({ id: 1, ...input });

      const result = await service.create(input as any, 1);

      expect(result).toBeDefined();
      expect(mockPrisma.comment.create).toHaveBeenCalled();
    });
  });
});
