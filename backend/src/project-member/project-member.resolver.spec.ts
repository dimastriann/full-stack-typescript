import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMemberResolver } from './project-member.resolver';
import { ProjectMemberService } from './project-member.service';
import { ProjectRole } from 'prisma/generated/enums';

describe('ProjectMemberResolver', () => {
  let resolver: ProjectMemberResolver;
  let service: ProjectMemberService;

  const mockService = {
    addMember: jest.fn(),
    removeMember: jest.fn(),
    updateMemberRole: jest.fn(),
    getProjectMembers: jest.fn(),
    getUserProjects: jest.fn(),
    inviteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMemberResolver,
        { provide: ProjectMemberService, useValue: mockService },
      ],
    }).compile();

    resolver = module.get<ProjectMemberResolver>(ProjectMemberResolver);
    service = module.get<ProjectMemberService>(ProjectMemberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('inviteToProject', () => {
    it('should call service with correct arguments', async () => {
      const input = {
        projectId: 1,
        email: 'test@test.com',
        role: ProjectRole.MEMBER,
      };
      const user = { id: 1 };
      mockService.inviteUser.mockResolvedValue({ id: 1, ...input, userId: 2 });

      await resolver.inviteToProject(input, user as any);

      expect(mockService.inviteUser).toHaveBeenCalledWith(
        input.projectId,
        user.id,
        input.email,
        input.role,
      );
    });
  });
});
