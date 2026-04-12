import { Test, TestingModule } from '@nestjs/testing';
import { ProjectResolver } from './project.resolver';
import { ProjectService } from './project.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';

describe('ProjectResolver', () => {
  let resolver: ProjectResolver;
  let service: ProjectService;

  const mockProjectService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectResolver,
        { provide: ProjectService, useValue: mockProjectService },
        { provide: PrismaService, useValue: {} },
        { provide: ProjectMemberService, useValue: {} },
      ],
    }).compile();

    resolver = module.get<ProjectResolver>(ProjectResolver);
    service = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createProject', () => {
    it('should call service with correct arguments', async () => {
      const input = { name: 'Test Project' }; // Simplified for test
      const user = { id: 1 };
      mockProjectService.create.mockResolvedValue({ id: 1, ...input });

      await resolver.createProject(input as any, user);
      
      expect(mockProjectService.create).toHaveBeenCalledWith(input, user.id);
    });
  });
});
