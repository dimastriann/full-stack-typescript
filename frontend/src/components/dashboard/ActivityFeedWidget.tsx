import { CheckCircle2, MessageSquare, Activity } from 'lucide-react';
import type { RecentActivityItem } from '../../features/dashboard/types/dashboard.types';

interface Props {
  data: RecentActivityItem[];
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const ACTIVITY_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  TASK_CREATED: {
    icon: CheckCircle2,
    color: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    label: 'created task',
  },
  COMMENT_ADDED: {
    icon: MessageSquare,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    label: 'commented on',
  },
};

export default function ActivityFeedWidget({ data }: Props) {
  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
          Recent Activity
        </h3>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400 dark:text-gray-600">
          <Activity size={32} strokeWidth={1.5} />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-4 bottom-4 w-px bg-surface-200 dark:bg-slate-700" />

          <ul className="space-y-4">
            {data.map((item, index) => {
              const config = ACTIVITY_CONFIG[item.type] ?? {
                icon: Activity,
                color: 'text-gray-500',
                bg: 'bg-surface-100 dark:bg-slate-800',
                label: 'updated',
              };
              const Icon = config.icon;

              return (
                <li
                  key={`${item.type}-${item.id}-${index}`}
                  className="flex items-start gap-3 pl-1"
                >
                  {/* Icon bubble */}
                  <div
                    className={`relative z-10 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${config.bg}`}
                  >
                    <Icon size={14} className={config.color} />
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.userName}
                      </span>{' '}
                      <span className="text-gray-500 dark:text-gray-400">
                        {config.label}
                      </span>{' '}
                      <span className="font-medium truncate">{item.title}</span>
                    </p>
                    {item.projectName && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {item.projectName}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 pt-0.5">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
