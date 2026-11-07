import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceService } from './workspace.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  const mockPrisma = {
    workspace: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a workspace successfully', async () => {
      const input = { name: 'Test Workspace', description: 'Test Description' };
      mockPrisma.workspace.create.mockResolvedValue({
        id: 1,
        ...input,
        ownerId: 1,
      });

      const result = await service.create(input, 1);

      expect(result).toBeDefined();
      expect(mockPrisma.workspace.create).toHaveBeenCalled();
    });
  });
});
