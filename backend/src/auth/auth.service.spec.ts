import { AuthService, JwtPayload } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockJwtService: jest.Mocked<Partial<JwtService>> = {
  sign: jest.fn().mockReturnValue('mock.access.token'),
  verify: jest.fn(),
};

const mockUserService = {
  findOne: jest.fn(),
};

// In-memory Redis mock
const redisStore: Record<string, string> = {};
const mockRedis = {
  setex: jest.fn((key: string, _ttl: number, val: string) => {
    redisStore[key] = val;
    return Promise.resolve('OK');
  }),
  get: jest.fn((key: string) => Promise.resolve(redisStore[key] ?? null)),
  exists: jest.fn((key: string) => Promise.resolve(key in redisStore ? 1 : 0)),
  del: jest.fn((...keys: string[]) => {
    for (const k of keys) delete redisStore[k];
    return Promise.resolve(keys.length);
  }),
  mget: jest.fn((...keys: string[]) =>
    Promise.resolve(keys.map((k) => redisStore[k] ?? null)),
  ),
  keys: jest.fn((pattern: string) => {
    const prefix = pattern.replace('*', '');
    return Promise.resolve(
      Object.keys(redisStore).filter((k) => k.startsWith(prefix)),
    );
  }),
  pipeline: jest.fn(() => {
    const ops: Array<() => void> = [];
    const pipe = {
      del: jest.fn((...keys: string[]) => {
        ops.push(() => {
          for (const k of keys) delete redisStore[k];
        });
        return pipe;
      }),
      setex: jest.fn((key: string, _ttl: number, val: string) => {
        ops.push(() => {
          redisStore[key] = val;
        });
        return pipe;
      }),
      exec: jest.fn(() => {
        for (const op of ops) op();
        return Promise.resolve([]);
      }),
    };
    return pipe;
  }),
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    // Clear the in-memory store between tests
    for (const key of Object.keys(redisStore)) delete redisStore[key];
    jest.clearAllMocks();

    service = new AuthService(
      mockJwtService as unknown as JwtService,
      mockUserService as unknown as UserService,
      mockPrismaService as any,
      mockRedis as never,
    );
  });

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('stores session and refresh keys in Redis and returns tokens', async () => {
      const result = await service.login({ id: 1, email: 'user@test.com' });

      expect(result.accessToken).toBe('mock.access.token');
      expect(result.refreshToken).toBe('mock.access.token');
      expect(result.sessionId).toMatch(
        /^[0-9a-f-]{36}$/, // UUID format
      );

      // Both Redis keys should now exist
      expect(mockRedis.setex).toHaveBeenCalledTimes(2);
    });
  });

  // ── validateSession ────────────────────────────────────────────────────────

  describe('validateSession()', () => {
    it('returns true when session key exists in Redis', async () => {
      redisStore['session:1:abc'] = '{"userId":1}';
      const valid = await service.validateSession(1, 'abc');
      expect(valid).toBe(true);
    });

    it('returns false when session key does not exist', async () => {
      const valid = await service.validateSession(1, 'nonexistent');
      expect(valid).toBe(false);
    });
  });

  // ── refresh ────────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    it('rotates tokens and removes old session keys on valid refresh', async () => {
      // Pre-seed a session
      redisStore['session:42:old-session'] = '{"userId":42}';
      redisStore['refresh:42:old-session'] = 'old.refresh.token';

      const oldPayload: JwtPayload = {
        sub: 42,
        username: 'user@test.com',
        sessionId: 'old-session',
      };

      mockJwtService.verify = jest.fn().mockReturnValue(oldPayload);
      mockUserService.findOne = jest
        .fn()
        .mockResolvedValue({ id: 42, email: 'user@test.com' });

      const result = await service.refresh('old.refresh.token');

      expect(result.accessToken).toBe('mock.access.token');
      expect(result.sessionId).not.toBe('old-session');

      // Old session keys should be gone
      expect(redisStore['session:42:old-session']).toBeUndefined();
      expect(redisStore['refresh:42:old-session']).toBeUndefined();
    });

    it('throws UnauthorizedException when refresh token is invalid JWT', async () => {
      mockJwtService.verify = jest.fn().mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('bad.token')).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('throws UnauthorizedException when stored token does not match (replay attack)', async () => {
      redisStore['session:1:sid'] = '{}';
      redisStore['refresh:1:sid'] = 'real.token';

      mockJwtService.verify = jest.fn().mockReturnValue({
        sub: 1,
        username: 'u@test.com',
        sessionId: 'sid',
      } satisfies JwtPayload);

      await expect(service.refresh('different.token')).rejects.toThrow(
        'Session expired or already revoked',
      );
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('deletes both session and refresh keys from Redis', async () => {
      redisStore['session:5:xyz'] = '{}';
      redisStore['refresh:5:xyz'] = 'token';

      await service.logout(5, 'xyz');

      expect(redisStore['session:5:xyz']).toBeUndefined();
      expect(redisStore['refresh:5:xyz']).toBeUndefined();
    });
  });

  // ── logoutAll ──────────────────────────────────────────────────────────────

  describe('logoutAll()', () => {
    it('deletes all session and refresh keys for a user', async () => {
      redisStore['session:7:s1'] = '{}';
      redisStore['session:7:s2'] = '{}';
      redisStore['refresh:7:s1'] = 'tok1';
      redisStore['refresh:7:s2'] = 'tok2';
      redisStore['session:9:other'] = '{}'; // different user — should not be touched

      await service.logoutAll(7);

      expect(redisStore['session:7:s1']).toBeUndefined();
      expect(redisStore['session:7:s2']).toBeUndefined();
      expect(redisStore['refresh:7:s1']).toBeUndefined();
      expect(redisStore['refresh:7:s2']).toBeUndefined();
      // Other user's session untouched
      expect(redisStore['session:9:other']).toBeDefined();
    });

    it('does nothing gracefully when no sessions exist', async () => {
      await expect(service.logoutAll(999)).resolves.toBeUndefined();
    });
  });
});
