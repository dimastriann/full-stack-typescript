import type { ProjectType } from './Projects';
import type { UserType } from './Users';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DEPLOYED = 'DEPLOYED',
  TESTING = 'TESTING',
  REVISION = 'REVISION',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

export type TaskType = {
  id?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  userId: number;
  user: UserType;
  projectId: number;
  project: ProjectType;
};
