import type { ProjectType } from './Projects';
import type { TaskType } from './Tasks';
import type { UserType } from './Users';

export enum TimesheetSource {
  MANUAL = 'MANUAL',
  TIMER = 'TIMER',
  INTEGRATION = 'INTEGRATION',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

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
  startTime?: string;
  endTime?: string;
  billable: boolean;
  hourlyRate?: number;
  cost?: number;
  source: TimesheetSource;
  approvalStatus: ApprovalStatus;
  approvedById?: number;
  approvedBy?: UserType;
  approvedAt?: string;
  tags?: string[];
};
