import type { ProjectType } from './Projects';
import type { TaskType } from './Tasks';
import type { UserType } from './Users';

export type TimesheetType = {
  id?: number;
  description: string;
  date: string;
  timeSpent: number;
  userId: number;
  user?: UserType;
  projectId: number;
  project?: ProjectType;
  taskId?: number;
  task?: TaskType;
};
