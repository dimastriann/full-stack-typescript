import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStageResolver } from './project-stage.resolver';
import { ProjectStageService } from './project-stage.service';

describe('ProjectStageResolver', () => {
  let resolver: ProjectStageResolver;
  let service: ProjectStageService;

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectStageResolver,
        { provide: ProjectStageService, useValue: mockService },
      ],
    }).compile();

    resolver = module.get<ProjectStageResolver>(ProjectStageResolver);
    service = module.get<ProjectStageService>(ProjectStageService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('projectStages', () => {
    it('should call service with correct arguments', async () => {
      const workspaceId = 1;
      const user = { id: 7 } as never;
      const result = [{ id: 1, name: 'Planning' }];
      mockService.findAll.mockResolvedValue(result);

      expect(await resolver.findAll(workspaceId, user)).toBe(result);
      expect(mockService.findAll).toHaveBeenCalledWith(workspaceId, 7);
    });
  });
});
