import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLevel, SubscriptionStatus } from '../../prisma/generated/client';

/**
 * Runs every 6 hours and writes a pre-aggregated analytics snapshot
 * to PlatformAnalyticsSnapshot. The Superadmin dashboard reads from
 * this table instead of running expensive aggregations live.
 */
@Injectable()
export class AnalyticsCronService {
  private readonly logger = new Logger(AnalyticsCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async takeSnapshot() {
    this.logger.log('📊 Starting platform analytics snapshot...');

    try {
      const snapshotDate = new Date();

      // ── Parallel aggregations ───────────────────────────────────────────────
      const [
        totalUsers,
        totalWorkspaces,
        totalProjects,
        activeSubscriptions,
        planBreakdown,
        newUsersToday,
        newWorkspacesToday,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.workspace.count(),
        this.prisma.project.count(),

        // Active paying subscriptions (excludes FREE / CANCELED)
        this.prisma.subscription.count({
          where: {
            status: SubscriptionStatus.ACTIVE,
            planLevel: { not: PlanLevel.FREE },
          },
        }),

        // Group subscriptions by planLevel to build a breakdown object
        this.prisma.subscription.groupBy({
          by: ['planLevel'],
          _count: { planLevel: true },
        }),

        // Users registered since midnight today
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),

        // Workspaces created since midnight today
        this.prisma.workspace.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

      // Build plan breakdown map  { FREE: 120, PRO: 45, ENTERPRISE: 3 }
      const planCounts: Record<string, number> = {};
      for (const row of planBreakdown) {
        planCounts[row.planLevel] = row._count.planLevel;
      }

      // Hardcoded MRR prices for estimation
      const PLAN_PRICES = {
        PRO: 29,
        ENTERPRISE: 99,
        CUSTOM: 299,
      };

      let mrr = 0;
      for (const [plan, count] of Object.entries(planCounts)) {
        if (plan in PLAN_PRICES) {
          mrr += count * PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
        }
      }

      // ── Write snapshot ──────────────────────────────────────────────────────
      await this.prisma.platformAnalyticsSnapshot.create({
        data: {
          snapshotDate,
          totalUsers,
          totalWorkspaces,
          totalProjects,
          activeSubscriptions,
          planBreakdown: planCounts as Prisma.InputJsonValue,
          newUsersToday,
          newWorkspacesToday,
          mrr,
        },
      });

      this.logger.log(
        `✅ Snapshot saved: ${totalUsers} users, ${totalWorkspaces} workspaces, ` +
          `${activeSubscriptions} active paid subscriptions`,
      );
    } catch (err) {
      this.logger.error(
        '❌ Analytics snapshot failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /** Manually trigger a snapshot — called on Superadmin dashboard load if no recent snapshot exists */
  async triggerManualSnapshot() {
    await this.takeSnapshot();
  }
}
