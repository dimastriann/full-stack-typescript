import { useRef, useMemo } from 'react';
import type { GanttTask, GanttZoom } from '../types/gantt.types';
import GanttHeader from './GanttHeader';
import GanttTaskBar from './GanttTaskBar';

interface Props {
  tasks: GanttTask[];
  zoom: GanttZoom;
  startDate: Date;
  totalDays: number;
}

const DAY_WIDTH: Record<GanttZoom, number> = {
  day: 48,
  week: 20,
  month: 8,
};

const ROW_HEIGHT = 44;
const LABEL_COL_WIDTH = 240;

const PRIORITY_BADGE: Record<string, { bg: string; text: string }> = {
  LOW: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  MEDIUM: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
  HIGH: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
  },
  URGENT: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
  },
};

export default function GanttChart({
  tasks,
  zoom,
  startDate,
  totalDays,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayWidthPx = DAY_WIDTH[zoom];
  const totalWidthPx = totalDays * dayWidthPx;

  // Calculate today line position
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = Math.round(
    (today.getTime() - startDate.getTime()) / 86400000,
  );
  const todayLeft = todayOffset * dayWidthPx;

  // Weekend shading columns
  const weekendColumns = useMemo(() => {
    const cols: number[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      if (d.getDay() === 0 || d.getDay() === 6) cols.push(i);
    }
    return cols;
  }, [startDate, totalDays]);

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 text-gray-400 dark:text-gray-600">
        <div className="text-center space-y-2">
          <p className="text-4xl">📋</p>
          <p className="text-sm font-medium">No tasks with dates to display</p>
          <p className="text-xs">
            Set start/due dates on tasks to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden border border-surface-200 dark:border-slate-700 rounded-xl">
      {/* ── Fixed Label Column ── */}
      <div
        className="flex-shrink-0 border-r border-surface-200 dark:border-slate-700 flex flex-col"
        style={{ width: `${LABEL_COL_WIDTH}px` }}
      >
        {/* Header spacer matching GanttHeader height */}
        <div className="h-8 border-b border-surface-200 dark:border-slate-700 bg-surface-50/80 dark:bg-slate-800/40 flex items-center px-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Task
          </span>
        </div>

        {/* Task rows */}
        <div className="overflow-y-auto flex-1">
          {tasks.map((task) => {
            const badge =
              PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.MEDIUM;
            return (
              <div
                key={task.id}
                className="border-b border-surface-100 dark:border-slate-800 flex items-center gap-2 px-3 hover:bg-surface-50 dark:hover:bg-slate-800/40 transition-colors"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {/* Stage dot */}
                <span
                  className="flex-shrink-0 h-2 w-2 rounded-full"
                  style={{ background: task.stage?.color ?? '#6b7280' }}
                />
                <span className="flex-1 text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {task.title}
                </span>
                <span
                  className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${badge.bg} ${badge.text}`}
                >
                  {task.priority.charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable Timeline ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Horizontal scroll wrapper */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div style={{ width: `${totalWidthPx}px`, minWidth: '100%' }}>
            {/* Header */}
            <GanttHeader
              startDate={startDate}
              zoom={zoom}
              totalDays={totalDays}
              dayWidthPx={dayWidthPx}
            />

            {/* Grid rows + bars */}
            <div className="relative">
              {/* Weekend shading */}
              {weekendColumns.map((colIdx) => (
                <div
                  key={colIdx}
                  className="absolute top-0 bottom-0 bg-surface-50/50 dark:bg-slate-800/20"
                  style={{
                    left: `${colIdx * dayWidthPx}px`,
                    width: `${dayWidthPx}px`,
                  }}
                />
              ))}

              {/* Today line */}
              {todayLeft >= 0 && todayLeft <= totalWidthPx && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary-500/70 z-20"
                  style={{ left: `${todayLeft}px` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] text-primary-600 dark:text-primary-400 font-bold bg-white dark:bg-slate-900 px-1 rounded">
                    Today
                  </div>
                </div>
              )}

              {/* Task rows */}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="relative border-b border-surface-100 dark:border-slate-800"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {/* Vertical grid lines */}
                  {Array.from({ length: totalDays }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-surface-100/50 dark:border-slate-800/50"
                      style={{
                        left: `${i * dayWidthPx}px`,
                        width: `${dayWidthPx}px`,
                      }}
                    />
                  ))}

                  <GanttTaskBar
                    task={task}
                    startDate={startDate}
                    dayWidthPx={dayWidthPx}
                    rowHeight={ROW_HEIGHT}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
