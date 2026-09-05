import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskStageService } from './task-stage.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('TaskStageService', () => {
  let service: TaskStageService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ role: 'USER' }),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
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

      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        role: 'MEMBER',
      });

      const result = await service.findAll(1, 7);

      expect(result).toEqual(mockStages);
      expect(mockPrisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: { workspaceId_userId: { workspaceId: 1, userId: 7 } },
        select: { role: true },
      });
      expect(mockPrisma.taskStage.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 1 },
        orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
      });
    });

    it('rejects a user outside the workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.findAll(42, 7)).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.taskStage.findMany).not.toHaveBeenCalled();
    });
  });
});
