import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceService } from './workspace.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let prisma: PrismaService;

  const mockPrisma = {
    workspace: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a workspace successfully', async () => {
      const input = { name: 'Test Workspace', description: 'Test Description' };
      mockPrisma.workspace.create.mockResolvedValue({ id: 1, ...input, ownerId: 1 });

      const result = await service.create(input, 1);
      
      expect(result).toBeDefined();
      expect(mockPrisma.workspace.create).toHaveBeenCalled();
    });
  });
});
