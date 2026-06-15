import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AnalyticsCronService } from './analytics-cron.service';
import {
  UserRole,
  PlanLevel,
  PaymentProvider,
} from '../../prisma/generated/client';
import { BackupService } from './backup.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SuperadminService {
  private readonly logger = new Logger(SuperadminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsCron: AnalyticsCronService,
    private readonly authService: AuthService,
    private readonly backupService: BackupService,
  ) {}

  // ─── Analytics ──────────────────────────────────────────────────────────────

  async getDashboardAnalytics() {
    // Get the most recent snapshot; trigger one if none exists yet
    let snapshot = await this.prisma.platformAnalyticsSnapshot.findFirst({
      orderBy: { snapshotDate: 'desc' },
    });

    if (!snapshot) {
      this.logger.warn(
        'No analytics snapshot found — triggering manual snapshot',
      );
      await this.analyticsCron.triggerManualSnapshot();
      snapshot = await this.prisma.platformAnalyticsSnapshot.findFirst({
        orderBy: { snapshotDate: 'desc' },
      });
    }

    // Also fetch the last 30 snapshots for trend charts
    const history = await this.prisma.platformAnalyticsSnapshot.findMany({
      orderBy: { snapshotDate: 'desc' },
      take: 30,
      select: {
        snapshotDate: true,
        totalUsers: true,
        totalWorkspaces: true,
        activeSubscriptions: true,
        newUsersToday: true,
      },
    });

    return { snapshot, history };
  }

  // ─── Users Management ────────────────────────────────────────────────────────

  async getUsers(params: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 50, search } = params;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          workspaceMembers: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              workspace: {
                select: {
                  id: true,
                  name: true,
                  subscription: { select: { planLevel: true, status: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, skip, take };
  }

  async updateUserRole(userId: number, role: UserRole) {
    if (role === UserRole.SUPERADMIN) {
      throw new BadRequestException(
        'Cannot promote a user to SUPERADMIN via this endpoint.',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }

  banUser(userId: number) {
    // Ban = invalidate all active sessions via Redis so the user is
    // immediately forced to re-authenticate. The JwtStrategy will then
    // reject any existing access tokens for this user on the next request.
    this.logger.warn(`Banning user ${userId} — invalidating all sessions`);
    return this.authService.logoutAll(userId).then(() => ({
      userId,
      banned: true,
      message: 'All active sessions have been invalidated.',
    }));
  }

  // ─── Workspaces Management ──────────────────────────────────────────────────

  async getWorkspaces(params: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const { skip = 0, take = 50, search } = params;
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [workspaces, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: {
              planLevel: true,
              status: true,
              provider: true,
              currentPeriodEnd: true,
            },
          },
          members: { select: { userId: true, role: true } },
          _count: { select: { projects: true } },
        },
      }),
      this.prisma.workspace.count({ where }),
    ]);

    return { workspaces, total, skip, take };
  }

  async overrideWorkspacePlan(workspaceId: number, planLevel: PlanLevel) {
    return this.prisma.subscription.upsert({
      where: { workspaceId },
      update: { planLevel },
      create: {
        workspaceId,
        planLevel,
        status: 'ACTIVE',
        provider: PaymentProvider.STRIPE, // placeholder; no actual payment
      },
    });
  }

  // ─── Payment Provider Configuration ─────────────────────────────────────────

  async getPaymentProviderConfigs() {
    const configs = await this.prisma.paymentProviderConfig.findMany();
    // Mask sensitive key fields before returning — replace secret values with
    // a safe placeholder so they are never exposed via the API response.
    return configs.map((cfg) => ({
      ...cfg,
      config: this._maskSensitiveKeys(cfg.config as Record<string, unknown>),
    }));
  }

  /**
   * Replaces the value of any config key that looks like a secret
   * (contains 'key', 'secret', or 'token') with a masked placeholder.
   * The actual value is preserved in the database — only the API response is masked.
   */
  private _maskSensitiveKeys(
    config: Record<string, unknown>,
  ): Record<string, unknown> {
    const sensitivePattern = /key|secret|token/i;
    return Object.fromEntries(
      Object.entries(config).map(([k, v]) => [
        k,
        sensitivePattern.test(k) && typeof v === 'string' && v.length > 0
          ? `${v.slice(0, 4)}${'*'.repeat(Math.max(0, v.length - 4))}`
          : v,
      ]),
    );
  }

  async upsertPaymentProviderConfig(
    provider: PaymentProvider,
    config: Record<string, unknown>,
    isDefault: boolean,
    isActive: boolean,
  ) {
    if (isDefault) {
      // Unset any existing default first
      await this.prisma.paymentProviderConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.paymentProviderConfig.upsert({
      where: { provider },
      update: { config: config as Prisma.InputJsonValue, isDefault, isActive },
      create: {
        provider,
        config: config as Prisma.InputJsonValue,
        isDefault,
        isActive,
      },
    });
  }

  // ─── Platform-level plan limits ──────────────────────────────────────────────

  async getPlanFeatureLimits() {
    return this.prisma.planFeatureLimit.findMany({
      orderBy: { planLevel: 'asc' },
    });
  }

  async updatePlanFeatureLimit(
    planLevel: PlanLevel,
    maxProjects: number,
    maxMembers: number,
    maxStorageGb: number,
  ) {
    return this.prisma.planFeatureLimit.update({
      where: { planLevel },
      data: { maxProjects, maxMembers, maxStorageGb },
    });
  }

  // ─── Settings Management ───────────────────────────────────────────────────

  async getAppSettings() {
    const settings = await this.prisma.appSetting.findMany();
    // Return key-value object
    return settings.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  async updateAppSettings(settings: Record<string, string>) {
    const updates = Object.entries(settings).map(([key, value]) => {
      return this.prisma.appSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });

    await Promise.all(updates);

    // If backup settings were updated, re-initialize scheduled backups
    const backupKeys = [
      'backup_enabled',
      'backup_frequency',
      'backup_time',
      'backup_retention_days',
      'backup_custom_credentials',
    ];
    const hasBackupUpdates = Object.keys(settings).some((key) =>
      backupKeys.includes(key),
    );
    if (hasBackupUpdates) {
      await this.backupService.initializeScheduledBackup();
    }

    return this.getAppSettings();
  }

  savePwaIcon(file: Express.Multer.File) {
    const uploadsFolder = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }

    const targetPath = path.join(uploadsFolder, 'pwa-icon.png');
    fs.writeFileSync(targetPath, file.buffer);
    return { success: true, url: '/api/pwa/icon.png' };
  }
}
