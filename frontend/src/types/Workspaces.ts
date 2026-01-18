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
};

export type Workspace = {
  id: number;
  name: string;
  description?: string;
  members?: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
};
