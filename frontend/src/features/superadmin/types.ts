export type Tab =
  | 'dashboard'
  | 'users'
  | 'workspaces'
  | 'payments'
  | 'limits'
  | 'backups'
  | 'settings';

export interface AnalyticsSnapshot {
  id: number;
  snapshotDate: string;
  totalUsers: number;
  totalWorkspaces: number;
  totalProjects: number;
  activeSubscriptions: number;
  mrrEstimate: number;
  newUsersToday: number;
}

export interface AnalyticsHistory {
  snapshotDate: string;
  totalUsers: number;
  totalWorkspaces: number;
  activeSubscriptions: number;
  newUsersToday: number;
}

export interface UserRecord {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'USER';
  createdAt: string;
  workspaceMembers?: Array<{
    workspace?: {
      id: number;
      name: string;
      subscription?: {
        planLevel: string;
        status: string;
      };
    };
  }>;
}

export interface WorkspaceRecord {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  subscription?: {
    planLevel: 'FREE' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
    status: string;
    provider: string;
    currentPeriodEnd?: string;
  } | null;
  members: Array<{ userId: number; role: string }>;
  _count: { projects: number };
}

export interface PaymentProviderConfig {
  id: number;
  provider: 'STRIPE' | 'XENDIT' | 'MIDTRANS';
  config: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimitRecord {
  id: number;
  planLevel: 'FREE' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
  maxProjects: number;
  maxMembers: number;
  maxStorageGb: number;
}

export interface SettingItem {
  key: string;
  value: string;
}

export interface BackupRecord {
  filename: string;
  size: number;
  createdAt: string;
}
