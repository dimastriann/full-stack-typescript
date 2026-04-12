import { Test, TestingModule } from '@nestjs/testing';
import { TaskResolver } from './task.resolver';
import { TaskService } from './task.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';

describe('TaskResolver', () => {
  let resolver: TaskResolver;
  let service: TaskService;

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskResolver,
        { provide: TaskService, useValue: mockTaskService },
        { provide: PrismaService, useValue: {} },
        { provide: ProjectMemberService, useValue: {} },
      ],
    }).compile();

    resolver = module.get<TaskResolver>(TaskResolver);
    service = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createTask', () => {
    it('should call service with correct arguments', async () => {
      const input = { title: 'Test Task', projectId: 1, userId: 1 };
      const user = { id: 1 };
      mockTaskService.create.mockResolvedValue({ id: 1, ...input });

      await resolver.createTask(input as any, user);
      
      expect(mockTaskService.create).toHaveBeenCalledWith(input, user.id);
    });
  });
});
