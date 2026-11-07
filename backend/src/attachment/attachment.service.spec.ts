import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentService } from './attachment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';

describe('AttachmentService', () => {
  let service: AttachmentService;
  let prisma: PrismaService;
  let projectMemberService: ProjectMemberService;

  const mockPrisma = {
    attachment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
    },
    comment: {
      findUnique: vi.fn(),
    },
    conversationParticipant: {
      findUnique: vi.fn(),
    },
  };

  const mockProjectMemberService = {
    checkPermission: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProjectMemberService, useValue: mockProjectMemberService },
      ],
    }).compile();

    service = module.get<AttachmentService>(AttachmentService);
    prisma = module.get<PrismaService>(PrismaService);
    projectMemberService =
      module.get<ProjectMemberService>(ProjectMemberService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
