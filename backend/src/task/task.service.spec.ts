import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';

const mockTask = {
  id: 1,
  title: 'Test Task',
  projectId: 1,
  userId: 1,
};

const mockPrisma = {
  task: {
    create: jest.fn().mockResolvedValue(mockTask),
    findMany: jest.fn().mockResolvedValue([mockTask]),
    findUnique: jest.fn().mockResolvedValue(mockTask),
    update: jest.fn().mockResolvedValue(mockTask),
    delete: jest.fn().mockResolvedValue(mockTask),
  },
};

const mockProjectMemberService = {
  checkPermission: jest.fn().mockResolvedValue(true),
  checkAccess: jest.fn().mockResolvedValue(true),
  getUserProjects: jest.fn().mockResolvedValue([{ projectId: 1 }]),
};

describe('TaskService', () => {
  let service: TaskService;
  let prisma: PrismaService;
  let projectMemberService: ProjectMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ProjectMemberService,
          useValue: mockProjectMemberService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    prisma = module.get<PrismaService>(PrismaService);
    projectMemberService = module.get<ProjectMemberService>(ProjectMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task with permission check', async () => {
      const createDto = {
        title: 'New Task',
        projectId: 1,
        stageId: 1,
      };

      const result = await service.create(createDto as any, 1);
      
      expect(result).toEqual(mockTask);
      expect(projectMemberService.checkPermission).toHaveBeenCalledWith(
        1,
        1,
        [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER]
      );
      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tasks for accessible projects', async () => {
      const result = await service.findAll(1);
      expect(result).toEqual([mockTask]);
      expect(projectMemberService.getUserProjects).toHaveBeenCalledWith(1);
      expect(prisma.task.findMany).toHaveBeenCalled();
    });
  });
});
