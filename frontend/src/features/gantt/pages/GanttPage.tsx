import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GanttChartIcon, ZoomIn, ZoomOut, ChevronDown } from 'lucide-react';
import { GET_GANTT_TASKS } from '../gql/gantt.graphql';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import type { GanttTask, GanttZoom } from '../types/gantt.types';
import GanttChart from '../components/GanttChart';

const ZOOM_OPTIONS: { label: string; value: GanttZoom; days: number }[] = [
  { label: 'Day view (30d)', value: 'day', days: 30 },
  { label: 'Week view (90d)', value: 'week', days: 90 },
  { label: 'Month view (180d)', value: 'month', days: 180 },
];

interface ProjectOption {
  id: number;
  name: string;
}

interface ProjectsQueryResult {
  projects: ProjectOption[];
}

interface GanttTasksQueryResult {
  tasks: GanttTask[];
}

export default function GanttPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  const [zoom, setZoom] = useState<GanttZoom>('week');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Fetch project list for the selector
  const { data: projectsData } = useQuery<ProjectsQueryResult>(GET_PROJECTS, {
    variables: { workspaceId: activeWorkspace?.id },
    skip: !activeWorkspace,
  });

  // Fetch tasks — all or per-project
  const { data: tasksData, loading } = useQuery<GanttTasksQueryResult>(GET_GANTT_TASKS, {
    variables: {
      take: 200,
      projectId: selectedProjectId ?? undefined,
    },
    skip: !activeWorkspace,
    fetchPolicy: 'cache-and-network',
  });

  const projects = projectsData?.projects ?? [];

  // Only tasks with at least one date
  const tasks = useMemo(
    () => (tasksData?.tasks ?? []).filter((t) => t.startDate ?? t.dueDate),
    [tasksData],
  );

  // Determine start date (30 days before earliest task, or today - 7)
  const startDate = useMemo(() => {
    const dates = tasks
      .flatMap((t) => [t.startDate, t.dueDate])
      .filter(Boolean)
      .map((d) => new Date(d!).getTime());

    const earliest = dates.length ? Math.min(...dates) : Date.now();
    const d = new Date(earliest);
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [tasks]);

  const zoomOption = ZOOM_OPTIONS.find((o) => o.value === zoom)!;
  const totalDays = zoomOption.days;

  const selectedProjectName =
    selectedProjectId === null
      ? 'All Projects'
      : (projects.find((p) => p.id === selectedProjectId)?.name ?? 'All Projects');

  const zoomIndex = ZOOM_OPTIONS.findIndex((o) => o.value === zoom);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <GanttChartIcon size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              Timeline
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} with dates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Project selector */}
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-primary-400 transition-colors"
            >
              <span className="max-w-[160px] truncate">{selectedProjectName}</span>
              <ChevronDown size={14} />
            </button>

            {showProjectDropdown && (
              <div className="absolute top-full mt-1 right-0 z-50 w-56 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 rounded-xl shadow-float py-1 max-h-60 overflow-y-auto">
                <button
                  onClick={() => { setSelectedProjectId(null); setShowProjectDropdown(false); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-surface-50 dark:hover:bg-slate-800 transition-colors ${selectedProjectId === null ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  All Projects
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProjectId(p.id); setShowProjectDropdown(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-surface-50 dark:hover:bg-slate-800 transition-colors truncate ${selectedProjectId === p.id ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setZoom(ZOOM_OPTIONS[Math.max(zoomIndex - 1, 0)].value)}
              disabled={zoomIndex === 0}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
              title="Zoom in"
            >
              <ZoomIn size={15} />
            </button>

            {ZOOM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setZoom(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  zoom === opt.value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-800'
                }`}
              >
                {opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}
              </button>
            ))}

            <button
              onClick={() => setZoom(ZOOM_OPTIONS[Math.min(zoomIndex + 1, ZOOM_OPTIONS.length - 1)].value)}
              disabled={zoomIndex === ZOOM_OPTIONS.length - 1}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
              title="Zoom out"
            >
              <ZoomOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      {loading && !tasksData ? (
        <div className="flex-1 card animate-pulse" />
      ) : (
        <GanttChart
          tasks={tasks}
          zoom={zoom}
          startDate={startDate}
          totalDays={totalDays}
        />
      )}
    </div>
  );
}
