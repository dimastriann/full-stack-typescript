import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    project: {
      count: jest.fn(),
    },
    timesheet: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects dashboard access for a non-member workspace', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER' });
    mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

    await expect(service.getStats(7, 42)).rejects.toThrow(ForbiddenException);

    expect(mockPrisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: { workspaceId_userId: { workspaceId: 42, userId: 7 } },
      select: { userId: true },
    });
    expect(mockPrisma.task.count).not.toHaveBeenCalled();
    expect(mockPrisma.task.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.project.count).not.toHaveBeenCalled();
  });
});
