import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceResolver } from './workspace.resolver';
import { WorkspaceService } from './workspace.service';

describe('WorkspaceResolver', () => {
  let resolver: WorkspaceResolver;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getWorkspaceMembers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceResolver,
        { provide: WorkspaceService, useValue: mockService },
      ],
    }).compile();

    resolver = module.get<WorkspaceResolver>(WorkspaceResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createWorkspace', () => {
    it('should call service with correct arguments', async () => {
      const input = { name: 'Test Workspace', description: 'Test Description' };
      const user = { id: 1 } as any;
      mockService.create.mockResolvedValue({ id: 1, ...input, ownerId: 1 });

      await resolver.createWorkspace(input, user);

      expect(mockService.create).toHaveBeenCalledWith(input, user.id);
    });
  });
});
