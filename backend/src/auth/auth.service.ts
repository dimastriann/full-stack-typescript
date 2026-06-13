import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { UserService } from '../user/user.service';

/** Seconds */
const ACCESS_TOKEN_TTL_S = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL_S = 60 * 60 * 24 * 7; // 7 days

export interface JwtPayload {
  sub: number;
  username: string;
  sessionId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ─── helpers ───────────────────────────────────────────────────────────────

  private sessionKey(userId: number, sessionId: string) {
    return `session:${userId}:${sessionId}`;
  }

  private refreshKey(userId: number, sessionId: string) {
    return `refresh:${userId}:${sessionId}`;
  }

  // ─── login ─────────────────────────────────────────────────────────────────

  async login(user: { id: number; email: string }) {
    const sessionId = randomUUID();

    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_TTL_S,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: REFRESH_TOKEN_TTL_S,
    });

    // Store session metadata in Redis
    await this.redis.setex(
      this.sessionKey(user.id, sessionId),
      REFRESH_TOKEN_TTL_S,
      JSON.stringify({ userId: user.id, email: user.email }),
    );

    // Store hashed refresh token so we can rotate/invalidate it
    await this.redis.setex(
      this.refreshKey(user.id, sessionId),
      REFRESH_TOKEN_TTL_S,
      refreshToken,
    );

    this.logger.log(`Session created for user ${user.id} [${sessionId}]`);

    return { accessToken, refreshToken, sessionId };
  }

  // ─── validate session (called by JwtStrategy) ──────────────────────────────

  async validateSession(userId: number, sessionId: string): Promise<boolean> {
    const exists = await this.redis.exists(this.sessionKey(userId, sessionId));
    return exists === 1;
  }

  // ─── refresh ───────────────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { sub: userId, sessionId } = payload;

    // Check stored refresh token matches and session still exists
    const [storedRefresh, sessionExists] = await this.redis.mget(
      this.refreshKey(userId, sessionId),
      this.sessionKey(userId, sessionId),
    );

    if (!storedRefresh || storedRefresh !== refreshToken || !sessionExists) {
      throw new UnauthorizedException('Session expired or already revoked');
    }

    // Rotate — atomically delete old session, create new one
    const newSessionId = randomUUID();
    const user = await this.userService.findOne(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const newPayload: JwtPayload = {
      sub: userId,
      username: user.email,
      sessionId: newSessionId,
    };

    const newAccessToken = this.jwtService.sign(newPayload, {
      expiresIn: ACCESS_TOKEN_TTL_S,
    });
    const newRefreshToken = this.jwtService.sign(newPayload, {
      expiresIn: REFRESH_TOKEN_TTL_S,
    });

    // Atomic rotation: delete old, set new
    const pipeline = this.redis.pipeline();
    pipeline.del(this.sessionKey(userId, sessionId));
    pipeline.del(this.refreshKey(userId, sessionId));
    pipeline.setex(
      this.sessionKey(userId, newSessionId),
      REFRESH_TOKEN_TTL_S,
      JSON.stringify({ userId, email: user.email }),
    );
    pipeline.setex(
      this.refreshKey(userId, newSessionId),
      REFRESH_TOKEN_TTL_S,
      newRefreshToken,
    );
    await pipeline.exec();

    this.logger.log(
      `Session rotated for user ${userId}: ${sessionId} → ${newSessionId}`,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: newSessionId,
    };
  }

  // ─── logout ────────────────────────────────────────────────────────────────

  async logout(userId: number, sessionId: string): Promise<void> {
    await this.redis.del(
      this.sessionKey(userId, sessionId),
      this.refreshKey(userId, sessionId),
    );
    this.logger.log(`Session destroyed for user ${userId} [${sessionId}]`);
  }

  // ─── logout all sessions (e.g. "sign out everywhere") ─────────────────────

  async logoutAll(userId: number): Promise<void> {
    const [sessionKeys, refreshKeys] = await Promise.all([
      this.redis.keys(`session:${userId}:*`),
      this.redis.keys(`refresh:${userId}:*`),
    ]);
    const allKeys = [...sessionKeys, ...refreshKeys];
    if (allKeys.length > 0) {
      await this.redis.del(...allKeys);
    }
    this.logger.log(`All sessions destroyed for user ${userId}`);
  }
}
