import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';
import DashboardStats from '../components/dashboard/DashboardStats';
import UserList from '../features/users/components/UserList';
import UserEditPage from '../features/users/pages/UserFormPage';
import ProjectList from '../features/projects/components/ProjectList';
import ProjectKanban from '../features/projects/components/ProjectKanban';
import ProjectEditPage from '../features/projects/pages/ProjectFormPage';
import TaskPage from '../features/tasks/pages/TaskPage';
import TaskFormPage from '../features/tasks/pages/TaskFormPage';
import TaskKanban from '../features/tasks/components/TaskKanban';
import TimesheetPage from '../features/timesheets/pages/TimesheetPage';
import TimesheetFormPage from '../features/timesheets/pages/TimesheetFormPage';
import ProfilePage from '../features/users/pages/ProfilePage';
import WorkspaceSettingsPage from '../features/workspaces/pages/WorkspaceSettingsPage';
import DiscussPage from '../pages/DiscussPage';
import CalendarPage from '../features/calendar/pages/CalendarPage';
import GanttPage from '../features/gantt/pages/GanttPage';
import TimerWidget from '../components/dashboard/TimerWidget';
import CommandPalette from '../components/CommandPalette';
import PaywallModal from '../components/dashboard/PaywallModal';
import PricingPage from '../pages/PricingPage';
import SuperadminPanel from '../features/superadmin/pages/SuperadminPanel';
import { Menu, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  return (
    <div className="flex h-screen bg-surface-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Top Header ── */}
        <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-900 px-6 h-[57px] flex items-center justify-between z-10 flex-shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Menu size={20} />
            </button>
            <Breadcrumbs />
          </div>

          <div className="flex items-center gap-3">
            <TimerWidget />
            {/* Ctrl+K search button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-gray-400 dark:text-gray-500 border border-surface-200 dark:border-slate-700 hover:border-primary-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all bg-white dark:bg-slate-900"
              title="Open command palette (Ctrl+K)"
            >
              <Search size={12} />
              <span>Search…</span>
              <kbd className="ml-1 text-[10px] font-mono bg-surface-100 dark:bg-slate-800 px-1 rounded">
                ⌘K
              </kbd>
            </button>
            <ThemeToggle />
            <WorkspaceSwitcher />
            <div className="h-8 w-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-primary-100 dark:ring-primary-900/20 transition-all">
              {user?.firstName?.[0]}
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <DashboardStats />
                </div>
              }
            />
            {isAdmin ? (
              <>
                <Route
                  path="/users"
                  element={
                    <div className="flex-1 overflow-y-auto p-6 page-enter">
                      <UserList />
                    </div>
                  }
                />
                <Route
                  path="/user/:userId"
                  element={
                    <div className="flex-1 overflow-y-auto p-6 page-enter">
                      <UserEditPage />
                    </div>
                  }
                />
              </>
            ) : (
              <>
                <Route path="/users" element={<Navigate to="/dashboard" />} />
                <Route
                  path="/user/:userId"
                  element={<Navigate to="/dashboard" />}
                />
              </>
            )}
            <Route
              path="/projects"
              element={
                <div className="flex-1 flex flex-col min-h-0 p-6 page-enter">
                  <ProjectKanban />
                </div>
              }
            />
            <Route
              path="/projects/list"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <ProjectList />
                </div>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <ProjectEditPage />
                </div>
              }
            />
            <Route
              path="/tasks"
              element={
                <div className="flex-1 flex flex-col min-h-0 p-6 page-enter">
                  <TaskKanban />
                </div>
              }
            />
            <Route
              path="/tasks/list"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <TaskPage />
                </div>
              }
            />
            <Route
              path="task/:taskId"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <TaskFormPage />
                </div>
              }
            />
            <Route
              path="timesheets"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <TimesheetPage />
                </div>
              }
            />
            <Route
              path="timesheet/:timesheetId"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <TimesheetFormPage />
                </div>
              }
            />
            <Route
              path="profile"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <ProfilePage />
                </div>
              }
            />
            <Route
              path="workspace/settings"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <WorkspaceSettingsPage />
                </div>
              }
            />
            <Route
              path="pricing"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <PricingPage />
                </div>
              }
            />
            <Route
              path="superadmin"
              element={
                <div className="flex-1 overflow-y-auto p-6 page-enter">
                  <SuperadminPanel />
                </div>
              }
            />
            <Route path="discuss" element={<DiscussPage />} />
            <Route
              path="calendar"
              element={
                <div className="flex-1 flex flex-col min-h-0 p-6 page-enter">
                  <CalendarPage />
                </div>
              }
            />
            <Route
              path="timeline"
              element={
                <div className="flex-1 flex flex-col min-h-0 p-6 page-enter">
                  <GanttPage />
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      {/* ── Command Palette ── */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />

      {/* ── Paywall Modal ── */}
      <PaywallModal />
    </div>
  );
}
