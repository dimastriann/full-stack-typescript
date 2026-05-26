import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardStats,
  TasksByStageItem,
  TasksByPriorityItem,
  ProjectProgressItem,
  TimelineEntry,
  RecentActivityItem,
  UpcomingDeadlineItem,
  TimesheetSummary,
} from './dto/dashboard-stats.type';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(
    userId: number,
    workspaceId?: number,
  ): Promise<DashboardStats> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);

    const workspaceFilter = workspaceId ? { workspaceId } : {};
    const projectFilter = workspaceId ? { project: { workspaceId } } : {};

    const [
      totalUsers,
      activeProjects,
      pendingTasks,
      completedThisWeek,
      overdueTasks,
    ] = await Promise.all([
      workspaceId
        ? this.prisma.workspaceMember.count({ where: { workspaceId } })
        : this.prisma.user.count(),

      this.prisma.project.count({
        where: {
          ...workspaceFilter,
          archivedAt: null,
          members: { some: { userId } },
        },
      }),

      this.prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          completedAt: null,
          ...projectFilter,
          stage: { isCompleted: false },
        },
      }),

      this.prisma.task.count({
        where: {
          ...projectFilter,
          deletedAt: null,
          completedAt: { gte: startOfWeek },
          stage: { isCompleted: true },
        },
      }),

      this.prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          completedAt: null,
          dueDate: { lt: now },
          stage: { isCompleted: false },
        },
      }),
    ]);

    const [
      tasksByStage,
      tasksByPriority,
      projectsProgress,
      activityTimeline,
      upcomingDeadlines,
      recentTasks,
      recentComments,
      timesheetSummary,
    ] = await Promise.all([
      this._getTasksByStage(userId, workspaceId),
      this._getTasksByPriority(userId, workspaceId),
      this._getProjectsProgress(userId, workspaceId),
      this._getActivityTimeline(workspaceId, thirtyDaysAgo),
      this._getUpcomingDeadlines(userId, workspaceId, now),
      this._getRecentTaskActivity(workspaceId),
      this._getRecentCommentActivity(workspaceId),
      this._getTimesheetSummary(
        userId,
        workspaceId,
        startOfWeek,
        startOfLastWeek,
        startOfMonth,
      ),
    ]);

    const recentActivity = this._mergeRecentActivity(
      recentTasks,
      recentComments,
    );

    return {
      totalUsers,
      activeProjects,
      pendingTasks,
      completedThisWeek,
      overdueTasks,
      tasksByStage,
      tasksByPriority,
      projectsProgress,
      activityTimeline,
      upcomingDeadlines,
      recentActivity,
      timesheetSummary,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async _getTasksByStage(
    userId: number,
    workspaceId?: number,
  ): Promise<TasksByStageItem[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(workspaceId ? { project: { workspaceId } } : {}),
        stage: { isNot: null },
      },
      select: {
        stage: {
          select: { title: true, color: true },
        },
      },
    });

    const map = new Map<string, { count: number; color: string }>();

    for (const t of tasks) {
      if (!t.stage) continue;
      const key = t.stage.title;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { count: 1, color: t.stage.color });
      }
    }

    const noStageCount = await this.prisma.task.count({
      where: {
        userId,
        deletedAt: null,
        stageId: null,
        ...(workspaceId ? { project: { workspaceId } } : {}),
      },
    });

    const result: TasksByStageItem[] = Array.from(map.entries()).map(
      ([stage, { count, color }]) => ({ stage, count, color }),
    );

    if (noStageCount > 0) {
      result.push({ stage: 'No Stage', count: noStageCount, color: '#6b7280' });
    }

    return result;
  }

  private async _getTasksByPriority(
    userId: number,
    workspaceId?: number,
  ): Promise<TasksByPriorityItem[]> {
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

    const counts = await Promise.all(
      priorities.map((priority) =>
        this.prisma.task.count({
          where: {
            userId,
            deletedAt: null,
            priority,
            ...(workspaceId ? { project: { workspaceId } } : {}),
          },
        }),
      ),
    );

    return priorities.map((priority, i) => ({ priority, count: counts[i] }));
  }

  private async _getProjectsProgress(
    userId: number,
    workspaceId?: number,
  ): Promise<ProjectProgressItem[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        archivedAt: null,
        ...(workspaceId ? { workspaceId } : {}),
        members: { some: { userId } },
      },
      select: {
        id: true,
        name: true,
        progress: true,
        budgetPlanned: true,
        budgetActual: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });

    return projects.map((p) => ({
      id: p.id,
      projectName: p.name,
      progress: p.progress,
      budgetPlanned: p.budgetPlanned,
      budgetActual: p.budgetActual,
    }));
  }

  private async _getActivityTimeline(
    workspaceId: number | undefined,
    from: Date,
  ): Promise<TimelineEntry[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: from },
        ...(workspaceId ? { project: { workspaceId } } : {}),
      },
      select: { createdAt: true, completedAt: true },
    });

    const timesheets = await this.prisma.timesheet.findMany({
      where: {
        date: { gte: from },
        ...(workspaceId ? { project: { workspaceId } } : {}),
      },
      select: { date: true, timeSpent: true },
    });

    // Build map for last 30 days
    const dayMap = new Map<
      string,
      { tasksCreated: number; tasksCompleted: number; hoursLogged: number }
    >();

    for (let i = 0; i < 30; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { tasksCreated: 0, tasksCompleted: 0, hoursLogged: 0 });
    }

    for (const t of tasks) {
      const createdKey = t.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(createdKey);
      if (entry) entry.tasksCreated++;

      if (t.completedAt) {
        const completedKey = t.completedAt.toISOString().slice(0, 10);
        const completedEntry = dayMap.get(completedKey);
        if (completedEntry) completedEntry.tasksCompleted++;
      }
    }

    for (const ts of timesheets) {
      const key = ts.date.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) entry.hoursLogged += ts.timeSpent;
    }

    return Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  private async _getUpcomingDeadlines(
    userId: number,
    workspaceId: number | undefined,
    now: Date,
  ): Promise<UpcomingDeadlineItem[]> {
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);

    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        completedAt: null,
        dueDate: { gte: now, lte: sevenDaysLater },
        ...(workspaceId ? { project: { workspaceId } } : {}),
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        project: { select: { name: true } },
        stage: { select: { title: true, color: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate!.toISOString(),
      priority: t.priority,
      projectName: t.project.name,
      stageName: t.stage?.title,
      stageColor: t.stage?.color,
    }));
  }

  private async _getRecentTaskActivity(workspaceId?: number) {
    return this.prisma.task.findMany({
      where: {
        deletedAt: null,
        ...(workspaceId ? { project: { workspaceId } } : {}),
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  private async _getRecentCommentActivity(workspaceId?: number) {
    return this.prisma.comment.findMany({
      where: {
        deletedAt: null,
        ...(workspaceId
          ? {
              OR: [
                { project: { workspaceId } },
                { task: { project: { workspaceId } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { name: true } },
        task: { select: { title: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  private _mergeRecentActivity(
    tasks: Awaited<ReturnType<DashboardService['_getRecentTaskActivity']>>,
    comments: Awaited<
      ReturnType<DashboardService['_getRecentCommentActivity']>
    >,
  ): RecentActivityItem[] {
    const taskItems: RecentActivityItem[] = tasks.map((t) => ({
      id: t.id,
      type: 'TASK_CREATED',
      title: t.title,
      userName: t.user.name,
      timestamp: t.createdAt.toISOString(),
      projectName: t.project.name,
    }));

    const commentItems: RecentActivityItem[] = comments.map((c) => ({
      id: c.id,
      type: 'COMMENT_ADDED',
      title: c.task?.title ?? c.project?.name ?? 'Unknown',
      userName: c.user.name,
      timestamp: c.createdAt.toISOString(),
      projectName: c.project?.name ?? c.task?.title,
    }));

    return [...taskItems, ...commentItems]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);
  }

  private async _getTimesheetSummary(
    userId: number,
    workspaceId: number | undefined,
    startOfWeek: Date,
    startOfLastWeek: Date,
    startOfMonth: Date,
  ): Promise<TimesheetSummary> {
    const workspaceFilter = workspaceId ? { project: { workspaceId } } : {};

    const [thisWeekTs, lastWeekTs, thisMonthTs] = await Promise.all([
      this.prisma.timesheet.findMany({
        where: { userId, date: { gte: startOfWeek }, ...workspaceFilter },
        select: { timeSpent: true },
      }),
      this.prisma.timesheet.findMany({
        where: {
          userId,
          date: { gte: startOfLastWeek, lt: startOfWeek },
          ...workspaceFilter,
        },
        select: { timeSpent: true },
      }),
      this.prisma.timesheet.findMany({
        where: { userId, date: { gte: startOfMonth }, ...workspaceFilter },
        select: { timeSpent: true },
      }),
    ]);

    const sum = (ts: { timeSpent: number }[]) =>
      ts.reduce((acc, t) => acc + t.timeSpent, 0);

    return {
      thisWeek: sum(thisWeekTs),
      lastWeek: sum(lastWeekTs),
      thisMonth: sum(thisMonthTs),
    };
  }
}
