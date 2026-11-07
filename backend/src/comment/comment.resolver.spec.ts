import { Test, TestingModule } from '@nestjs/testing';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('CommentResolver', () => {
  let resolver: CommentResolver;
  let service: CommentService;
  let prisma: PrismaService;

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    findByParentId: vi.fn(),
  };

  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentResolver,
        { provide: CommentService, useValue: mockService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    resolver = module.get<CommentResolver>(CommentResolver);
    service = module.get<CommentService>(CommentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createComment', () => {
    it('should call service with correct arguments', async () => {
      const input = { content: 'Test comment', projectId: 1, userId: 1 };
      const user = { id: 1 };
      mockService.create.mockResolvedValue({ id: 1, ...input });

      await resolver.createComment(input as any, user as any);

      expect(mockService.create).toHaveBeenCalledWith(input, user.id);
    });
  });
});
