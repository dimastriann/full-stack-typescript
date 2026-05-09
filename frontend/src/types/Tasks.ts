import type { ProjectType } from './Projects';
import type { UserType } from './Users';

export type TaskStage = {
  id: number;
  title: string;
  color: string;
  sequence: number;
  isCompleted: boolean;
  isCanceled: boolean;
};

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskTypeEnum {
  TASK = 'TASK',
  BUG = 'BUG',
  STORY = 'STORY',
  EPIC = 'EPIC',
}

export type TaskType = {
  id?: number;
  title: string;
  description?: string;
  userId: number;
  user: UserType;
  projectId: number;
  project: ProjectType;
  stageId?: number;
  sequence: number;
  estimatedHours: number;
  actualHours?: number;
  dueDate?: string;
  priority: TaskPriority;
  stage?: TaskStage;
  parentTaskId?: number;
  parentTask?: TaskType;
  subtasks?: TaskType[];
  type: TaskTypeEnum;
  reporterId?: number;
  reporter?: UserType;
  startDate?: string;
  completedAt?: string;
  remainingHours: number;
  progress: number;
  tags?: string[];
  deletedAt?: string;
};
