import { useRef, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { GET_CALENDAR_TASKS } from '../gql/calendar.graphql';
import { UPDATE_TASK } from '../../tasks/gql/task.graphql';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import CalendarEventPopover from '../components/CalendarEventPopover';

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

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

const VIEW_OPTIONS: { label: string; value: ViewType }[] = [
  { label: 'Month', value: 'dayGridMonth' },
  { label: 'Week', value: 'timeGridWeek' },
  { label: 'Day', value: 'timeGridDay' },
  { label: 'List', value: 'listWeek' },
];

export default function CalendarPage() {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  const [currentView, setCurrentView] = useState<ViewType>('dayGridMonth');
  const [currentTitle, setCurrentTitle] = useState('');
  const [popover, setPopover] = useState<{
    task: CalendarTask;
    rect: DOMRect;
  } | null>(null);

  const { data, loading } = useQuery<{ tasks: CalendarTask[] }>(
    GET_CALENDAR_TASKS,
    {
      variables: { take: 200 },
      skip: !activeWorkspace,
      fetchPolicy: 'cache-and-network',
    },
  );

  const [updateTask] = useMutation(UPDATE_TASK);

  // Convert tasks to FullCalendar events
  const events = (data?.tasks ?? []).map((task) => {
    const color = task.stage?.color ?? PRIORITY_COLORS[task.priority] ?? '#6366f1';
    const start = task.startDate ?? task.dueDate;
    const end = task.dueDate;

    return {
      id: String(task.id),
      title: task.title,
      start: start ?? undefined,
      end: end ?? undefined,
      allDay: true,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { task },
      classNames: [
        task.completedAt ? 'fc-event-completed' : '',
        `fc-priority-${task.priority.toLowerCase()}`,
      ].filter(Boolean),
    };
  });

  const handleEventClick = useCallback((info: EventClickArg) => {
    const task = info.event.extendedProps.task as CalendarTask;
    const rect = info.el.getBoundingClientRect();
    setPopover({ task, rect });
  }, []);

  const handleEventDrop = useCallback(
    (info: { event: { id: string; start: Date | null; end: Date | null } }) => {
      void updateTask({
        variables: {
          input: {
            id: Number(info.event.id),
            dueDate: info.event.end ?? info.event.start,
            startDate: info.event.start,
          },
        },
      });
    },
    [updateTask],
  );

  const handleDateClick = useCallback(
    (info: { dateStr: string }) => {
      navigate(`/dashboard/tasks?date=${info.dateStr}`);
    },
    [navigate],
  );

  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
    setCurrentTitle(calendarRef.current?.getApi().view.title ?? '');
  }, []);

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
    setCurrentTitle(calendarRef.current?.getApi().view.title ?? '');
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
    setCurrentTitle(calendarRef.current?.getApi().view.title ?? '');
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
    setCurrentTitle(calendarRef.current?.getApi().view.title ?? '');
  };

  return (
    <div className="h-full flex flex-col gap-4 select-none">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <CalendarDays size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              Calendar
            </h1>
            {currentTitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentTitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 rounded-xl p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-400"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 rounded-xl p-1">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleViewChange(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentView === opt.value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="flex-1 min-h-0 card p-4 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 z-10 rounded-2xl">
            <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={currentView}
          headerToolbar={false}
          events={events}
          editable
          selectable
          selectMirror
          dayMaxEvents={4}
          weekends
          height="100%"
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          dateClick={handleDateClick}
          datesSet={(info) => setCurrentTitle(info.view.title)}
          eventContent={(info: EventContentArg) => (
            <div
              className="px-1.5 py-0.5 rounded text-white text-[11px] font-semibold truncate w-full"
              title={info.event.title}
            >
              {info.event.title}
            </div>
          )}
        />
      </div>

      {/* ── Event Popover ── */}
      {popover && (
        <CalendarEventPopover
          task={popover.task}
          anchorRect={popover.rect}
          onClose={() => setPopover(null)}
          onNavigate={(id) => {
            navigate(`/dashboard/task/${id}`);
            setPopover(null);
          }}
        />
      )}
    </div>
  );
}
