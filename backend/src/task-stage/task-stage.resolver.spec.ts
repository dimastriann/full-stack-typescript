import { Test, TestingModule } from '@nestjs/testing';
import { TaskStageResolver } from './task-stage.resolver';
import { TaskStageService } from './task-stage.service';

describe('TaskStageResolver', () => {
  let resolver: TaskStageResolver;
  let service: TaskStageService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskStageResolver,
        { provide: TaskStageService, useValue: mockService },
      ],
    }).compile();

    resolver = module.get<TaskStageResolver>(TaskStageResolver);
    service = module.get<TaskStageService>(TaskStageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('taskStages', () => {
    it('should call service with correct arguments', async () => {
      const workspaceId = 1;
      const result = [{ id: 1, name: 'To Do' }];
      mockService.findAll.mockResolvedValue(result);

      expect(await resolver.findAll(workspaceId)).toBe(result);
      expect(mockService.findAll).toHaveBeenCalledWith(workspaceId);
    });
  });
});
