import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { randomUUID, randomBytes } from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';

/** Seconds */
const ACCESS_TOKEN_TTL_S = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL_S = 60 * 60 * 24 * 7; // 7 days
const PRE_AUTH_TOKEN_TTL_S = 60 * 5; // 5 minutes

const APP_NAME = 'ProjectFlow';
const BACKUP_CODE_COUNT = 8;

export interface JwtPayload {
  sub: number;
  username: string;
  sessionId: string;
}

interface PreAuthPayload {
  sub: number;
  username: string;
  /** Discriminator so this token cannot be used as a full access token. */
  twoFactorPending: true;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ─── helpers ───────────────────────────────────────────────────────────────

  private sessionKey(userId: number, sessionId: string) {
    return `session:${userId}:${sessionId}`;
  }

  private refreshKey(userId: number, sessionId: string) {
    return `refresh:${userId}:${sessionId}`;
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: BACKUP_CODE_COUNT }, () =>
      randomBytes(5).toString('hex').toUpperCase(),
    );
  }

  /** Decode a JWT payload without signature verification (safe for pre-auth tokens). */
  decodeToken(token: string): Record<string, unknown> | null {
    return this.jwtService.decode(token) as Record<string, unknown> | null;
  }

  // ─── session creation (shared by login & completeTwoFactorLogin) ────────────

  private async createSession(user: { id: number; email: string }) {
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

    await this.redis.setex(
      this.sessionKey(user.id, sessionId),
      REFRESH_TOKEN_TTL_S,
      JSON.stringify({ userId: user.id, email: user.email }),
    );

    await this.redis.setex(
      this.refreshKey(user.id, sessionId),
      REFRESH_TOKEN_TTL_S,
      refreshToken,
    );

    this.logger.log(`Session created for user ${user.id} [${sessionId}]`);

    return { accessToken, refreshToken, sessionId };
  }

  // ─── login ─────────────────────────────────────────────────────────────────

  async login(user: { id: number; email: string }) {
    return this.createSession(user);
  }

  // ─── 2FA — setup (generates secret, does NOT enable yet) ───────────────────

  async setupTwoFactor(
    userId: number,
  ): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: APP_NAME,
      label: user.email,
      secret,
    });

    // Persist the secret but leave twoFactorEnabled = false until verification
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    this.logger.log(`2FA secret generated for user ${userId}`);

    return { secret, otpauthUrl };
  }

  // ─── 2FA — verify token and enable ─────────────────────────────────────────

  async verifyAndEnableTwoFactor(
    userId: number,
    token: string,
  ): Promise<{ enabled: boolean; backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException(
        'No 2FA secret found. Run setupTwoFactor first.',
      );
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException(
        'Two-Factor Authentication is already enabled.',
      );
    }

    const result = verifySync({ token, secret: user.twoFactorSecret });
    if (!result.valid) {
      throw new BadRequestException(
        'Invalid verification code. Please try again.',
      );
    }

    const backupCodes = this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes,
      },
    });

    this.logger.log(`2FA enabled for user ${userId}`);

    return { enabled: true, backupCodes };
  }

  // ─── 2FA — disable ─────────────────────────────────────────────────────────

  async disableTwoFactor(userId: number, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException(
        'Two-Factor Authentication is not currently enabled.',
      );
    }

    const result = verifySync({ token, secret: user.twoFactorSecret });
    if (!result.valid) {
      throw new BadRequestException('Invalid verification code.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    this.logger.log(`2FA disabled for user ${userId}`);
  }

  // ─── 2FA — issue pre-auth token (issued during login when 2FA is required) ──

  issuePreAuthToken(user: { id: number; email: string }): string {
    const payload: PreAuthPayload = {
      sub: user.id,
      username: user.email,
      twoFactorPending: true,
    };
    return this.jwtService.sign(payload, { expiresIn: PRE_AUTH_TOKEN_TTL_S });
  }

  // ─── 2FA — complete login (validates pre-auth token + TOTP, creates session) ─

  async completeTwoFactorLogin(
    preAuthToken: string,
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    let payload: PreAuthPayload;
    try {
      payload = this.jwtService.verify<PreAuthPayload>(preAuthToken);
    } catch {
      throw new UnauthorizedException('Pre-auth token is invalid or expired.');
    }

    if (!payload.twoFactorPending) {
      throw new UnauthorizedException('Invalid pre-auth token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA is not properly configured.');
    }

    // Try TOTP verification first
    const totpResult = verifySync({ token, secret: user.twoFactorSecret });

    if (!totpResult.valid) {
      // Fall back to one-time backup codes
      const normalizedToken = token.toUpperCase().trim();
      if (!user.twoFactorBackupCodes.includes(normalizedToken)) {
        throw new UnauthorizedException('Invalid authentication code.');
      }

      // Consume the backup code — remove it from the stored array
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: user.twoFactorBackupCodes.filter(
            (code) => code !== normalizedToken,
          ),
        },
      });

      this.logger.warn(
        `User ${user.id} used a backup code to complete 2FA login.`,
      );
    }

    return this.createSession({ id: user.id, email: user.email });
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

    const [storedRefresh, sessionExists] = await this.redis.mget(
      this.refreshKey(userId, sessionId),
      this.sessionKey(userId, sessionId),
    );

    if (!storedRefresh || storedRefresh !== refreshToken || !sessionExists) {
      throw new UnauthorizedException('Session expired or already revoked');
    }

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

  // ─── logout all sessions ───────────────────────────────────────────────────

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
