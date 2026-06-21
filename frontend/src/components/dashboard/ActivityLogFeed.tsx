import { useQuery } from '@apollo/client';
import {
  CheckCircle2,
  Trash2,
  Edit3,
  UserPlus,
  UserCheck,
  UserMinus,
  Activity,
  ArrowRight,
} from 'lucide-react';
import React from 'react';
import { GET_ACTIVITY_LOGS } from '../../features/projects/gql/activity-log.graphql';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityLogFeedProps {
  workspaceId?: number;
  projectId?: number;
  entityType?: string;
  entityId?: number;
  /** Maximum number of log entries to fetch (default: 20). */
  limit?: number;
}

/** A field-level diff entry inside an UPDATE log payload. */
interface FieldChange {
  from: string | number | boolean | null;
  to: string | number | boolean | null;
}

/** Parsed details blob – values are either field diffs or scalar metadata. */
interface LogDetails {
  /** For CREATE / DELETE */
  title?: string;
  name?: string;
  /** For INVITE_MEMBER */
  inviteeEmail?: string;
  role?: string;
  /** For UPDATE_MEMBER_ROLE */
  targetUserName?: string;
  fromRole?: string;
  toRole?: string;
  /** For REMOVE_MEMBER */
  removedUserName?: string;
  /** Field diffs for UPDATE actions – keys are field names */
  [key: string]: FieldChange | string | number | boolean | null | undefined;
}

interface LogUser {
  id: number;
  name: string;
}

interface LogProject {
  id: number;
  name: string;
}

interface ActivityLogEntry {
  id: number;
  action: string;
  entityType: string;
  details?: string | null;
  createdAt: string;
  user: LogUser;
  project?: LogProject | null;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface ActionConfig {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  CREATE: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    label: 'Created',
  },
  DELETE: {
    icon: Trash2,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    label: 'Deleted',
  },
  UPDATE: {
    icon: Edit3,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    label: 'Updated',
  },
  INVITE_MEMBER: {
    icon: UserPlus,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    label: 'Invited member',
  },
  UPDATE_MEMBER_ROLE: {
    icon: UserCheck,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    label: 'Updated role',
  },
  REMOVE_MEMBER: {
    icon: UserMinus,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    label: 'Removed member',
  },
};

const DEFAULT_CONFIG: ActionConfig = {
  icon: Activity,
  color: 'text-gray-500',
  bg: 'bg-surface-100 dark:bg-slate-800',
  label: 'Unknown',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function isFieldChange(value: unknown): value is FieldChange {
  return (
    typeof value === 'object' &&
    value !== null &&
    'from' in value &&
    'to' in value
  );
}

function formatDetails(
  action: string,
  entityType: string,
  detailsStr?: string | null,
): React.ReactNode {
  if (!detailsStr) return null;

  let details: LogDetails;
  try {
    details = JSON.parse(detailsStr) as LogDetails;
  } catch {
    return (
      <span className="text-gray-500 dark:text-gray-400">{detailsStr}</span>
    );
  }

  const entityLabel = entityType.toLowerCase();
  const boldName = (text?: string | null) => (
    <span className="font-semibold text-gray-800 dark:text-gray-200">
      &quot;{text}&quot;
    </span>
  );

  if (action === 'CREATE' || action === 'DELETE') {
    return (
      <span className="text-gray-500 dark:text-gray-400">
        {entityLabel} {boldName(details.title ?? details.name)}
      </span>
    );
  }

  if (action === 'UPDATE') {
    return (
      <div className="mt-1 space-y-1">
        {Object.entries(details).map(([key, value]) => {
          if (!isFieldChange(value)) return null;
          return (
            <div
              key={key}
              className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1.5 flex-wrap"
            >
              <span className="font-semibold text-gray-600 dark:text-gray-300 capitalize">
                {key}:
              </span>
              <span className="line-through text-red-500/80 bg-red-50 dark:bg-red-950/10 px-1 rounded">
                {String(value.from ?? 'none')}
              </span>
              <ArrowRight size={10} className="text-gray-400" />
              <span className="text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-950/10 px-1 rounded">
                {String(value.to ?? 'none')}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (action === 'INVITE_MEMBER') {
    return (
      <span className="text-gray-500 dark:text-gray-400">
        invited{' '}
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {details.inviteeEmail}
        </span>{' '}
        as {details.role}
      </span>
    );
  }

  if (action === 'UPDATE_MEMBER_ROLE') {
    return (
      <span className="text-gray-500 dark:text-gray-400">
        changed{' '}
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {details.targetUserName ?? 'member'}
        </span>
        &apos;s role from {details.fromRole} to {details.toRole}
      </span>
    );
  }

  if (action === 'REMOVE_MEMBER') {
    return (
      <span className="text-gray-500 dark:text-gray-400">
        removed{' '}
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {details.removedUserName ?? 'member'}
        </span>
      </span>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityLogFeed({
  workspaceId,
  projectId,
  entityType,
  entityId,
  limit = 20,
}: ActivityLogFeedProps) {
  const { data, loading, error, refetch } = useQuery(GET_ACTIVITY_LOGS, {
    variables: { workspaceId, projectId, entityType, entityId, take: limit },
    fetchPolicy: 'network-only',
  });

  const logs = (data?.activityLogs ?? []) as ActivityLogEntry[];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 dark:bg-red-950/10 rounded-2xl">
        Failed to load activity logs: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} className="text-primary-600 dark:text-primary-400" />
          Activity Log
        </h3>
        <button
          onClick={() => refetch()}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* Empty state */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400 dark:text-gray-600 border border-dashed border-surface-200 dark:border-slate-800 rounded-2xl">
          <Activity size={32} strokeWidth={1.5} />
          <p className="text-sm">No activity recorded yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline rail */}
          <div className="absolute left-[15px] top-3 bottom-3 w-px bg-surface-200 dark:bg-slate-800" />

          <ul className="space-y-5">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] ?? DEFAULT_CONFIG;
              const Icon = config.icon;

              return (
                <li key={log.id} className="flex items-start gap-4 relative">
                  {/* Icon bubble */}
                  <div
                    className={`relative z-10 flex-shrink-0 h-[30px] w-[30px] rounded-full flex items-center justify-center ${config.bg} shadow-sm`}
                  >
                    <Icon size={13} className={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                      <span className="font-bold text-gray-900 dark:text-white mr-1">
                        {log.user.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 mr-1.5">
                        {config.label.toLowerCase()}
                      </span>
                      {formatDetails(log.action, log.entityType, log.details)}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatTimeAgo(log.createdAt)}
                      </span>
                      {log.project && (
                        <>
                          <span className="text-gray-300 dark:text-slate-700 text-[10px]">
                            •
                          </span>
                          <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 px-1.5 py-0.5 rounded-md">
                            {log.project.name}
                          </span>
                        </>
                      )}
                      <span className="text-gray-300 dark:text-slate-700 text-[10px]">
                        •
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-surface-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md uppercase font-semibold tracking-wider">
                        {log.entityType}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
