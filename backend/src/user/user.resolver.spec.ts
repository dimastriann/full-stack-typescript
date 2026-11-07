import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { ForbiddenException } from '@nestjs/common';

describe('UserResolver', () => {
  let resolver: UserResolver;

  const mockUserService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByEmail: vi.fn(),
  };

  const mockAuthService = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('users', () => {
    it('should return an array of users', async () => {
      const result = [{ id: 1, email: 'test@test.com' }];
      mockUserService.findAll.mockResolvedValue(result);

      expect(await resolver.users()).toBe(result);
      expect(mockUserService.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });
  });

  describe('updateUser', () => {
    it('rejects updates targeting another account', () => {
      const input = { id: 8, role: 'SUPERADMIN' } as never;
      const currentUser = { id: 7 } as never;

      expect(() => resolver.updateUser(input, currentUser)).toThrow(
        ForbiddenException,
      );
      expect(mockUserService.update).not.toHaveBeenCalled();
    });

    it('updates the authenticated account', () => {
      const input = { id: 7, firstName: 'Updated' } as never;
      const currentUser = { id: 7 } as never;

      resolver.updateUser(input, currentUser);

      expect(mockUserService.update).toHaveBeenCalledWith(7, input);
    });
  });
});
