import { Test, TestingModule } from '@nestjs/testing';
import { TaskStageService } from './task-stage.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('TaskStageService', () => {
  let service: TaskStageService;
  let prisma: PrismaService;

  const mockPrisma = {
    taskStage: {
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
        TaskStageService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TaskStageService>(TaskStageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all task stages', async () => {
      const mockStages = [
        { id: 1, name: 'To Do', workspaceId: 1 },
        { id: 2, name: 'Done', workspaceId: 1 },
      ];
      mockPrisma.taskStage.findMany.mockResolvedValue(mockStages);

      const result = await service.findAll(1);

      expect(result).toEqual(mockStages);
      expect(mockPrisma.taskStage.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 1 },
        orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
      });
    });
  });
});
