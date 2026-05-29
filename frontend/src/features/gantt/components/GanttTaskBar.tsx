import { useNavigate } from 'react-router-dom';
import type { GanttTask } from '../types/gantt.types';

interface Props {
  task: GanttTask;
  startDate: Date;
  dayWidthPx: number;
  rowHeight: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#6366f1',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export default function GanttTaskBar({
  task,
  startDate,
  dayWidthPx,
  rowHeight,
}: Props) {
  const navigate = useNavigate();

  // Tasks without dates are shown as zero-width placeholders
  if (!task.startDate && !task.dueDate) {
    return (
      <div
        className="absolute inset-0 flex items-center px-3"
        style={{ height: `${rowHeight}px` }}
      >
        <span className="text-[10px] text-gray-300 dark:text-gray-600 italic">
          No dates set
        </span>
      </div>
    );
  }

  const taskStart = task.startDate
    ? new Date(task.startDate)
    : new Date(task.dueDate!);
  const taskEnd = task.dueDate
    ? new Date(task.dueDate)
    : new Date(task.startDate!);

  const offsetDays = daysBetween(startDate, taskStart);
  const durationDays = Math.max(daysBetween(taskStart, taskEnd), 1);

  const left = offsetDays * dayWidthPx;
  const width = durationDays * dayWidthPx;

  if (left + width < 0 || left > 9999) return null; // Off screen

  const barColor =
    task.stage?.color ?? PRIORITY_COLORS[task.priority] ?? '#6366f1';

  const isCompleted = !!task.completedAt || task.stage?.isCompleted;
  const progress = Math.min(Math.max(task.progress, 0), 100);

  // Milestone: same start and due date, or 0 estimated hours
  const isMilestone = durationDays <= 1 && task.estimatedHours === 0;

  const handleClick = () => navigate(`/dashboard/task/${task.id}`);

  if (isMilestone) {
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
        style={{ left: `${left + dayWidthPx / 2 - 8}px` }}
        onClick={handleClick}
        title={task.title}
      >
        <div
          className="h-4 w-4 rotate-45 shadow-sm group-hover:scale-125 transition-transform"
          style={{ background: barColor }}
        />
      </div>
    );
  }

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
      style={{ left: `${left + 2}px`, width: `${width - 4}px`, height: '22px' }}
      onClick={handleClick}
      title={`${task.title} — ${progress.toFixed(0)}%`}
    >
      {/* Bar background */}
      <div
        className={`relative w-full h-full rounded-md overflow-hidden shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-px ${isCompleted ? 'opacity-60' : ''}`}
        style={{ background: `${barColor}25` }}
      >
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-md transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: barColor,
            opacity: 0.85,
          }}
        />

        {/* Task label */}
        <div className="absolute inset-0 flex items-center px-2 z-10">
          <span
            className="text-[10px] font-semibold truncate"
            style={{
              color: isCompleted ? barColor : '#fff',
              mixBlendMode: isCompleted ? 'normal' : 'normal',
            }}
          >
            {task.title}
          </span>
        </div>
      </div>
    </div>
  );
}
