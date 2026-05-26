import type { GanttZoom } from '../types/gantt.types';

interface Props {
  startDate: Date;
  zoom: GanttZoom;
  totalDays: number;
  dayWidthPx: number;
}

function getDayColumns(
  start: Date,
  total: number,
): { date: Date; isToday: boolean; isWeekend: boolean }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: total }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    date.setHours(0, 0, 0, 0);

    return {
      date,
      isToday: date.getTime() === today.getTime(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });
}

function formatDayLabel(date: Date, zoom: GanttZoom): string {
  if (zoom === 'month') {
    return date.getDate() === 1
      ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      : '';
  }
  if (zoom === 'week') {
    return date.getDay() === 1
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function GanttHeader({
  startDate,
  zoom,
  totalDays,
  dayWidthPx,
}: Props) {
  const columns = getDayColumns(startDate, totalDays);

  return (
    <div className="flex-shrink-0 border-b border-surface-200 dark:border-slate-700">
      <div
        className="flex"
        style={{ width: `${totalDays * dayWidthPx}px` }}
      >
        {columns.map((col, i) => {
          const label = formatDayLabel(col.date, zoom);
          const showLabel = label !== '';

          return (
            <div
              key={i}
              className={`
                flex-shrink-0 border-r
                ${col.isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                ${col.isWeekend && !col.isToday ? 'bg-surface-50/60 dark:bg-slate-800/30' : ''}
                ${col.isToday ? 'border-r-primary-400' : 'border-r-surface-200 dark:border-r-slate-700'}
              `}
              style={{ width: `${dayWidthPx}px`, minWidth: `${dayWidthPx}px` }}
            >
              <div className="h-8 flex items-center px-1">
                {showLabel && (
                  <span
                    className={`text-[10px] font-semibold truncate ${
                      col.isToday
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
