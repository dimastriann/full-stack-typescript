export interface TasksByStageItem {
  stage: string;
  count: number;
  color: string;
}

export interface TasksByPriorityItem {
  priority: string;
  count: number;
}

export interface ProjectProgressItem {
  id: number;
  projectName: string;
  progress: number;
  budgetPlanned: number;
  budgetActual: number;
}

export interface TimelineEntry {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
  hoursLogged: number;
}

export interface RecentActivityItem {
  id: number;
  type: string;
  title: string;
  userName: string;
  timestamp: string;
  projectName?: string;
}

export interface UpcomingDeadlineItem {
  id: number;
  title: string;
  dueDate: string;
  priority: string;
  projectName?: string;
  stageName?: string;
  stageColor?: string;
}

export interface TimesheetSummary {
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
}

export interface DashboardStatsData {
  totalUsers: number;
  activeProjects: number;
  pendingTasks: number;
  completedThisWeek: number;
  overdueTasks: number;
  tasksByStage: TasksByStageItem[];
  tasksByPriority: TasksByPriorityItem[];
  projectsProgress: ProjectProgressItem[];
  activityTimeline: TimelineEntry[];
  upcomingDeadlines: UpcomingDeadlineItem[];
  recentActivity: RecentActivityItem[];
  timesheetSummary: TimesheetSummary;
}
