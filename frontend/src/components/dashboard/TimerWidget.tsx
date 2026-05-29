import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Timer, Play, Pause, Square, ChevronDown, Search } from 'lucide-react';
import { useTimerStore } from '../../store/timerStore';
import { GET_TASKS } from '../../features/tasks/gql/task.graphql';
import { CREATE_TIMESHEET } from '../../features/timesheets/gql/timesheet.graphql';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuthStore } from '../../store/authStore';

interface Task {
  id: number;
  title: string;
  project: { id: number; name: string };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const hStr = h > 0 ? `${h}:` : '';
  return `${hStr}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerWidget() {
  const [displayMs, setDisplayMs] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isRunning,
    taskId,
    taskTitle,
    projectId,
    projectName,
    start,
    pause,
    stop,
    getElapsedMs,
  } = useTimerStore();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const user = useAuthStore((s) => s.user);

  const { data: tasksData } = useQuery<{ tasks: Task[] }>(GET_TASKS, {
    skip: !showDropdown || !activeWorkspace,
    variables: { take: 100 },
  });

  const [createTimesheet] = useMutation(CREATE_TIMESHEET, {
    refetchQueries: ['GetTimesheets'],
  });

  // Live display ticker
  useEffect(() => {
    if (!isRunning) {
      setDisplayMs(getElapsedMs());
      return;
    }
    const interval = setInterval(() => setDisplayMs(getElapsedMs()), 500);
    return () => clearInterval(interval);
  }, [isRunning, getElapsedMs]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleStop = async () => {
    if (!taskId || !projectId || !user) {
      stop();
      return;
    }

    const totalMs = getElapsedMs();
    stop();

    if (totalMs < 30000) return; // Don't log less than 30 seconds

    const hours = totalMs / 3600000;
    await createTimesheet({
      variables: {
        input: {
          description: `Timer: ${taskTitle ?? 'Task'}`,
          date: new Date().toISOString(),
          timeSpent: Math.round(hours * 100) / 100,
          userId: user.id,
          projectId,
          taskId,
          source: 'TIMER',
        },
      },
    });
  };

  const handleSelectTask = (task: Task) => {
    if (isRunning) pause();
    start({
      id: task.id,
      title: task.title,
      projectId: task.project.id,
      projectName: task.project.name,
    });
    setShowDropdown(false);
    setSearch('');
  };

  const filteredTasks = (tasksData?.tasks ?? []).filter(
    (t) =>
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.project.name.toLowerCase().includes(search.toLowerCase()),
  );

  const hasTime = displayMs > 0;

  return (
    <div className="relative flex items-center gap-1.5" ref={dropdownRef}>
      {/* Timer display */}
      {hasTime && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
            isRunning
              ? 'bg-primary-600/20 text-primary-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          <Timer size={12} className={isRunning ? 'animate-pulse' : ''} />
          {formatTime(displayMs)}
        </div>
      )}

      {/* Task label (truncated) */}
      <button
        onClick={() => setShowDropdown((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-200 hover:bg-slate-800 transition-colors max-w-[140px]"
        title={taskTitle ?? 'Select a task to track'}
      >
        <span className="truncate">{taskTitle ?? 'Start timer…'}</span>
        <ChevronDown size={12} />
      </button>

      {/* Play/Pause/Stop controls */}
      {isRunning ? (
        <button
          onClick={() => void pause()}
          className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"
          title="Pause timer"
        >
          <Pause size={14} />
        </button>
      ) : (
        taskId && (
          <button
            onClick={() =>
              start({
                id: taskId,
                title: taskTitle!,
                projectId: projectId!,
                projectName: projectName!,
              })
            }
            className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-500/10 transition-colors"
            title="Resume timer"
          >
            <Play size={14} />
          </button>
        )
      )}

      {hasTime && (
        <button
          onClick={() => void handleStop()}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          title="Stop and log timesheet"
        >
          <Square size={14} />
        </button>
      )}

      {/* Task selector dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 rounded-2xl shadow-float z-50 overflow-hidden">
          <div className="p-3 border-b border-surface-100 dark:border-slate-800">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="w-full pl-8 pr-3 py-2 text-xs bg-surface-50 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-700 dark:text-gray-300 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filteredTasks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                No tasks found
              </p>
            ) : (
              filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleSelectTask(task)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-surface-50 dark:hover:bg-slate-800 transition-colors ${
                    task.id === taskId
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {task.title}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    {task.project.name}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
