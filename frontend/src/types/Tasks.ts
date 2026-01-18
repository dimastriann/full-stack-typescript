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
  stage?: TaskStage;
};
