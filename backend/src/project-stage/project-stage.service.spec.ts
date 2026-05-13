import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStageService } from './project-stage.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ProjectStageService', () => {
  let service: ProjectStageService;
  let prisma: PrismaService;

  const mockPrisma = {
    projectStage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectStageService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectStageService>(ProjectStageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all project stages', async () => {
      const mockStages = [
        { id: 1, name: 'Planning', workspaceId: 1 },
        { id: 2, name: 'In Progress', workspaceId: 1 },
      ];
      mockPrisma.projectStage.findMany.mockResolvedValue(mockStages);

      const result = await service.findAll(1);

      expect(result).toEqual(mockStages);
      expect(mockPrisma.projectStage.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 1 },
        orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
      });
    });
  });
});
