import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  const mockPrisma = {
    conversation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    conversationParticipant: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects message reads from a non-participant', async () => {
    mockPrisma.conversationParticipant.findUnique.mockResolvedValue(null);

    await expect(service.getMessages(42, 7)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockPrisma.message.findMany).not.toHaveBeenCalled();
  });

  it('rejects conversation deletion by a non-participant', async () => {
    mockPrisma.conversationParticipant.findUnique.mockResolvedValue(null);

    await expect(service.deleteConversation(42, 7)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockPrisma.conversation.delete).not.toHaveBeenCalled();
  });
});
