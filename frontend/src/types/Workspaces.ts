import type { UserType } from './Users';

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export type WorkspaceMember = {
  id: number;
  workspaceId: number;
  userId: number;
  role: WorkspaceRole;
  joinedAt: string;
  user?: UserType;
  workspace?: Workspace;
};

export type Subscription = {
  planLevel: 'FREE' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
};

export type Workspace = {
  id: number;
  name: string;
  description?: string;
  members?: WorkspaceMember[];
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
};
