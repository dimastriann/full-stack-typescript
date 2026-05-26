import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Search,
  FolderGit2,
  ListTodo,
  Users,
  LayoutDashboard,
  CalendarDays,
  GanttChartIcon,
  Timer,
  Settings,
  User,
  MessageSquare,
  ArrowRight,
  Hash,
} from 'lucide-react';
import { GET_TASKS } from '../features/tasks/gql/task.graphql';
import { GET_PROJECTS } from '../features/projects/gql/project.graphql';
import { useWorkspaceStore } from '../store/workspaceStore';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  keywords?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function useCommandItems(navigate: ReturnType<typeof useNavigate>, onClose: () => void) {
  const activeWorkspace = useWorkspaceStore(
    (state: { activeWorkspace: { id?: number } | null }) => state.activeWorkspace,
  );

  const { data: tasksData } = useQuery<{
    tasks: { id: number; title: string; project: { id: number; name: string } }[];
  }>(GET_TASKS, {
    variables: { take: 50 },
    skip: !activeWorkspace,
  });

  const { data: projectsData } = useQuery<{
    projects: { id: number; name: string }[];
  }>(GET_PROJECTS, {
    variables: { workspaceId: activeWorkspace?.id, take: 50 },
    skip: !activeWorkspace,
  });

  const go = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose],
  );

  const staticItems: CommandItem[] = [
    { id: 'nav-dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, action: () => go('/dashboard'), category: 'Navigate', keywords: 'home overview stats' },
    { id: 'nav-projects', label: 'Projects', icon: FolderGit2, action: () => go('/dashboard/projects'), category: 'Navigate', keywords: 'kanban board' },
    { id: 'nav-tasks', label: 'Tasks', icon: ListTodo, action: () => go('/dashboard/tasks'), category: 'Navigate', keywords: 'kanban board list' },
    { id: 'nav-calendar', label: 'Calendar', icon: CalendarDays, action: () => go('/dashboard/calendar'), category: 'Navigate', keywords: 'schedule dates' },
    { id: 'nav-timeline', label: 'Timeline / Gantt', icon: GanttChartIcon, action: () => go('/dashboard/timeline'), category: 'Navigate', keywords: 'gantt chart' },
    { id: 'nav-timesheets', label: 'Timesheets', icon: Timer, action: () => go('/dashboard/timesheets'), category: 'Navigate', keywords: 'time tracking hours' },
    { id: 'nav-users', label: 'Users', icon: Users, action: () => go('/dashboard/users'), category: 'Navigate', keywords: 'team members admin' },
    { id: 'nav-discuss', label: 'Discuss / Chat', icon: MessageSquare, action: () => go('/dashboard/discuss'), category: 'Navigate', keywords: 'messages channels' },
    { id: 'nav-profile', label: 'My Profile', icon: User, action: () => go('/dashboard/profile'), category: 'Navigate', keywords: 'account settings' },
    { id: 'nav-workspace', label: 'Workspace Settings', icon: Settings, action: () => go('/dashboard/workspace/settings'), category: 'Navigate', keywords: 'config stages members' },
    { id: 'new-project', label: 'Create New Project', icon: FolderGit2, action: () => go('/dashboard/project/new'), category: 'Actions', keywords: 'add create' },
    { id: 'new-task', label: 'Create New Task', icon: ListTodo, action: () => go('/dashboard/task/new'), category: 'Actions', keywords: 'add create' },
  ];

  const taskItems: CommandItem[] = (tasksData?.tasks ?? []).map((task) => ({
    id: `task-${task.id}`,
    label: task.title,
    description: task.project.name,
    icon: Hash,
    action: () => go(`/dashboard/task/${task.id}`),
    category: 'Tasks',
    keywords: task.title.toLowerCase(),
  }));

  const projectItems: CommandItem[] = (projectsData?.projects ?? []).map((p) => ({
    id: `project-${p.id}`,
    label: p.name,
    icon: FolderGit2,
    action: () => go(`/dashboard/project/${p.id}`),
    category: 'Projects',
    keywords: p.name.toLowerCase(),
  }));

  return [...staticItems, ...taskItems, ...projectItems];
}

export default function CommandPalette({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useCommandItems(navigate, onClose);

  const filtered = query.trim()
    ? allItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.keywords?.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      })
    : allItems.filter((item) => item.category === 'Navigate');

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const flatList = Object.values(grouped).flat();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => setActiveIndex(0), [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flatList[activeIndex]?.action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  let flatIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[9999] w-full max-w-xl px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-float border border-surface-200 dark:border-slate-700 overflow-hidden animate-slide-in-up">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-200 dark:border-slate-800">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or type a command…"
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            />
            <kbd className="flex-shrink-0 px-1.5 py-0.5 text-[10px] text-gray-400 bg-surface-100 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 rounded font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
            {flatList.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-600">
                No results for "{query}"
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-600">
                    {category}
                  </div>
                  {items.map((item) => {
                    const currentIdx = flatIdx++;
                    const isActive = activeIndex === currentIdx;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        data-idx={currentIdx}
                        onClick={item.action}
                        onMouseEnter={() => setActiveIndex(currentIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-surface-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive
                              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                              : 'bg-surface-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isActive
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {item.label}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {isActive && (
                          <ArrowRight size={14} className="text-primary-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-surface-100 dark:border-slate-800 flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-600">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> open</span>
            <span><kbd className="font-mono">Esc</kbd> close</span>
          </div>
        </div>
      </div>
    </>
  );
}
