import { useQuery } from '@apollo/client';
import {
  Users,
  FolderGit2,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  Timer,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { GET_DASHBOARD_STATS } from '../../features/dashboard/gql/dashboard.graphql';
import { useWorkspaceStore } from '../../store/workspaceStore';
import type { DashboardStatsData } from '../../features/dashboard/types/dashboard.types';
import TasksByStageChart from './TasksByStageChart';
import TasksByPriorityChart from './TasksByPriorityChart';
import ActivityTimelineChart from './ActivityTimelineChart';
import ProjectProgressWidget from './ProjectProgressWidget';
import UpcomingDeadlinesWidget from './UpcomingDeadlinesWidget';
import ActivityFeedWidget from './ActivityFeedWidget';

// ── KPI Stat Card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accentFrom: string;
  accentTo: string;
  iconBg: string;
  iconColor: string;
  trend?: { value: number; label: string };
  alert?: boolean;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accentFrom,
  accentTo,
  iconBg,
  iconColor,
  trend,
  alert,
}: StatCardProps) {
  const TrendIcon =
    trend?.value == null
      ? Minus
      : trend.value > 0
        ? TrendingUp
        : trend.value < 0
          ? TrendingDown
          : Minus;

  const trendColor =
    trend?.value == null
      ? 'text-gray-400'
      : trend.value > 0
        ? 'text-emerald-500'
        : trend.value < 0
          ? 'text-red-500'
          : 'text-gray-400';

  return (
    <div
      className={`card p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 ${alert ? 'ring-1 ring-red-500/30' : ''}`}
    >
      {/* Accent left bar */}
      <div
        className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${accentFrom} ${accentTo}`}
      />

      <div className="flex items-start gap-4 pl-2">
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0`}
        >
          <Icon size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {value.toLocaleString()}
          </p>

          {trend && (
            <div className={`flex items-center gap-1 mt-1.5 ${trendColor}`}>
              <TrendIcon size={12} />
              <span className="text-xs font-semibold">
                {Math.abs(trend.value)} {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-surface-200 dark:bg-slate-800 rounded-xl ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-[104px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonPulse className="h-[296px]" />
        <SkeletonPulse className="h-[296px]" />
      </div>
      <SkeletonPulse className="h-[264px]" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonPulse className="h-[320px]" />
        <SkeletonPulse className="h-[320px]" />
        <SkeletonPulse className="h-[320px]" />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DashboardStats() {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  const { data, loading, error } = useQuery<{
    dashboardStats: DashboardStatsData;
  }>(GET_DASHBOARD_STATS, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
    fetchPolicy: 'cache-and-network',
  });

  if (loading && !data) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-5 rounded-2xl shadow-sm">
        <div className="font-semibold mb-1">Error loading dashboard</div>
        <div className="text-sm opacity-80">{error.message}</div>
      </div>
    );
  }

  const stats = data?.dashboardStats;

  if (!stats) return null;

  const timesheetTrend =
    stats.timesheetSummary.thisWeek - stats.timesheetSummary.lastWeek;

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          accentFrom="from-primary-400"
          accentTo="to-primary-600"
          iconBg="bg-primary-50 dark:bg-primary-900/20 group-hover:bg-primary-600"
          iconColor="text-primary-600 dark:text-primary-400 group-hover:text-white"
        />
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
          icon={FolderGit2}
          accentFrom="from-emerald-400"
          accentTo="to-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-600"
          iconColor="text-emerald-600 dark:text-emerald-400 group-hover:text-white"
        />
        <StatCard
          label="Pending Tasks"
          value={stats.pendingTasks}
          icon={ListTodo}
          accentFrom="from-amber-400"
          accentTo="to-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-600"
          iconColor="text-amber-600 dark:text-amber-400 group-hover:text-white"
        />
        <StatCard
          label="Done This Week"
          value={stats.completedThisWeek}
          icon={CheckCircle2}
          accentFrom="from-cyan-400"
          accentTo="to-cyan-600"
          iconBg="bg-cyan-50 dark:bg-cyan-900/20 group-hover:bg-cyan-600"
          iconColor="text-cyan-600 dark:text-cyan-400 group-hover:text-white"
          trend={{ value: stats.completedThisWeek, label: 'completed' }}
        />
        <StatCard
          label="Hours Logged"
          value={Math.round(stats.timesheetSummary.thisWeek * 10) / 10}
          icon={Timer}
          accentFrom="from-violet-400"
          accentTo="to-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-900/20 group-hover:bg-violet-600"
          iconColor="text-violet-600 dark:text-violet-400 group-hover:text-white"
          trend={{
            value: Math.round(timesheetTrend * 10) / 10,
            label: 'h vs last week',
          }}
        />
      </div>

      {/* Overdue alert card — only if there are overdue tasks */}
      {stats.overdueTasks > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <p className="text-sm font-semibold">
            You have{' '}
            <span className="font-black">{stats.overdueTasks}</span> overdue{' '}
            {stats.overdueTasks === 1 ? 'task' : 'tasks'} — consider
            prioritizing them.
          </p>
        </div>
      )}

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TasksByStageChart data={stats.tasksByStage} />
        <TasksByPriorityChart data={stats.tasksByPriority} />
      </div>

      {/* ── Activity Timeline ── */}
      <ActivityTimelineChart data={stats.activityTimeline} />

      {/* ── Bottom Widgets ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectProgressWidget data={stats.projectsProgress} />
        <UpcomingDeadlinesWidget data={stats.upcomingDeadlines} />
        <ActivityFeedWidget data={stats.recentActivity} />
      </div>
    </div>
  );
}
