import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class TasksByStageItem {
  @Field()
  stage: string;

  @Field(() => Int)
  count: number;

  @Field()
  color: string;
}

@ObjectType()
export class TasksByPriorityItem {
  @Field()
  priority: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class ProjectProgressItem {
  @Field(() => Int)
  id: number;

  @Field()
  projectName: string;

  @Field(() => Float)
  progress: number;

  @Field(() => Float)
  budgetPlanned: number;

  @Field(() => Float)
  budgetActual: number;
}

@ObjectType()
export class TimelineEntry {
  @Field()
  date: string;

  @Field(() => Int)
  tasksCreated: number;

  @Field(() => Int)
  tasksCompleted: number;

  @Field(() => Float)
  hoursLogged: number;
}

@ObjectType()
export class RecentActivityItem {
  @Field(() => Int)
  id: number;

  @Field()
  type: string;

  @Field()
  title: string;

  @Field()
  userName: string;

  @Field()
  timestamp: string;

  @Field({ nullable: true })
  projectName?: string;
}

@ObjectType()
export class UpcomingDeadlineItem {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  dueDate: string;

  @Field()
  priority: string;

  @Field({ nullable: true })
  projectName?: string;

  @Field({ nullable: true })
  stageName?: string;

  @Field({ nullable: true })
  stageColor?: string;
}

@ObjectType()
export class TimesheetSummary {
  @Field(() => Float)
  thisWeek: number;

  @Field(() => Float)
  lastWeek: number;

  @Field(() => Float)
  thisMonth: number;
}

@ObjectType()
export class DashboardStats {
  // ── Core KPIs ──────────────────────────────────────────────────────────────

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  activeProjects: number;

  @Field(() => Int)
  pendingTasks: number;

  @Field(() => Int)
  completedThisWeek: number;

  @Field(() => Int)
  overdueTasks: number;

  // ── Charts data ────────────────────────────────────────────────────────────

  @Field(() => [TasksByStageItem])
  tasksByStage: TasksByStageItem[];

  @Field(() => [TasksByPriorityItem])
  tasksByPriority: TasksByPriorityItem[];

  @Field(() => [ProjectProgressItem])
  projectsProgress: ProjectProgressItem[];

  @Field(() => [TimelineEntry])
  activityTimeline: TimelineEntry[];

  // ── Widgets ────────────────────────────────────────────────────────────────

  @Field(() => [UpcomingDeadlineItem])
  upcomingDeadlines: UpcomingDeadlineItem[];

  @Field(() => [RecentActivityItem])
  recentActivity: RecentActivityItem[];

  @Field(() => TimesheetSummary)
  timesheetSummary: TimesheetSummary;
}
