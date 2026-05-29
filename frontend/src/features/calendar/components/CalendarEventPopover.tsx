import { useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  CalendarClock,
  User,
  Folder,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface CalendarTask {
  id: number;
  title: string;
  priority: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  progress: number;
  stage?: {
    id: number;
    title: string;
    color: string;
    isCompleted: boolean;
  };
  project: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
    firstName: string;
  };
}

interface Props {
  task: CalendarTask;
  anchorRect: DOMRect;
  onClose: () => void;
  onNavigate: (id: number) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  MEDIUM: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  HIGH: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  URGENT: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CalendarEventPopover({
  task,
  anchorRect,
  onClose,
  onNavigate,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Position the popover relative to viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(anchorRect.bottom + 8, window.innerHeight - 280),
    left: Math.min(anchorRect.left, window.innerWidth - 320),
    zIndex: 9999,
    width: 300,
  };

  const isCompleted = !!task.completedAt || task.stage?.isCompleted;

  return (
    <div
      ref={ref}
      style={style}
      className="bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 rounded-2xl shadow-float p-4 flex flex-col gap-3 animate-slide-in-up"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {isCompleted ? (
            <CheckCircle2
              size={16}
              className="text-emerald-500 flex-shrink-0 mt-0.5"
            />
          ) : (
            <Circle
              size={16}
              className="text-gray-400 dark:text-gray-600 flex-shrink-0 mt-0.5"
            />
          )}
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
            {task.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* Stage + Priority */}
      <div className="flex items-center gap-2 flex-wrap">
        {task.stage && (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
            style={{ background: task.stage.color }}
          >
            {task.stage.title}
          </span>
        )}
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.MEDIUM}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Meta */}
      <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Folder size={12} />
          <span className="truncate">{task.project.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <User size={12} />
          <span>{task.user.name}</span>
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-2">
            <CalendarClock size={12} />
            <span>Due {formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      {task.progress > 0 && (
        <div>
          <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span className="font-semibold">{task.progress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-surface-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={() => onNavigate(task.id)}
        className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors"
      >
        <ExternalLink size={12} />
        Open Task
      </button>
    </div>
  );
}
