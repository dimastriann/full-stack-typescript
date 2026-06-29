import type { WorkspaceMember } from './Workspaces';

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export type UserType = {
  id?: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role?: UserRole;
  birthDate?: Date;
  mobile?: string;
  phone?: string;
  status: boolean;
  workspaceMembers?: WorkspaceMember[];
  twoFactorEnabled?: boolean;
};
