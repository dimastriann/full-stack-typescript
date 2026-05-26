import { Link } from 'react-router-dom';
import { CalendarClock, Clock } from 'lucide-react';
import type { UpcomingDeadlineItem } from '../../features/dashboard/types/dashboard.types';

interface Props {
  data: UpcomingDeadlineItem[];
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  MEDIUM: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  HIGH: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  URGENT: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

function formatRelativeDate(dateStr: string): string {
  const due = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `In ${diff}d`;
}

function getUrgencyClass(dateStr: string): string {
  const due = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff < 0) return 'text-red-600 dark:text-red-400';
  if (diff === 0) return 'text-orange-600 dark:text-orange-400';
  if (diff <= 2) return 'text-amber-600 dark:text-amber-400';
  return 'text-gray-500 dark:text-gray-400';
}

export default function UpcomingDeadlinesWidget({ data }: Props) {
  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
          Upcoming Deadlines
        </h3>
        <Link
          to="/dashboard/tasks"
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
        >
          View all
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400 dark:text-gray-600">
          <CalendarClock size={32} strokeWidth={1.5} />
          <p className="text-sm">No upcoming deadlines — great job! 🎉</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((item) => (
            <li key={item.id}>
              <Link
                to={`/dashboard/task/${item.id}`}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                {/* Stage color dot */}
                <span
                  className="mt-1 flex-shrink-0 h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
                  style={{ background: item.stageColor ?? '#6b7280' }}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {item.title}
                  </p>
                  {item.projectName && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {item.projectName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold ${getUrgencyClass(item.dueDate)}`}
                  >
                    <Clock size={10} />
                    {formatRelativeDate(item.dueDate)}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.MEDIUM}`}
                  >
                    {item.priority}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
