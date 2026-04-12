import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'hashedPassword',
};

const mockPrisma = {
  user: {
    findUnique: jest.fn().mockResolvedValue(mockUser),
    findMany: jest.fn().mockResolvedValue([mockUser]),
    create: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    delete: jest.fn().mockResolvedValue(mockUser),
  },
  workspace: {
    create: jest.fn().mockResolvedValue({ id: 1, name: 'Test Workspace' }),
  },
  projectStage: {
    createMany: jest.fn().mockResolvedValue({ count: 2 }),
  },
  taskStage: {
    createMany: jest.fn().mockResolvedValue({ count: 3 }),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: expect.any(Object),
      });
    });
  });

  describe('create', () => {
    it('should create a user, workspace, and default stages in a transaction', async () => {
      const createDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const result = await service.create(createDto as any);
      
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.workspace.create).toHaveBeenCalled();
      expect(prisma.projectStage.createMany).toHaveBeenCalled();
      expect(prisma.taskStage.createMany).toHaveBeenCalled();
    });
  });
});
