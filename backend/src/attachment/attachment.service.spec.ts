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
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
    },
    conversationParticipant: {
      findUnique: jest.fn(),
    },
  };

  const mockProjectMemberService = {
    checkPermission: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
