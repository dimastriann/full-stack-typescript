import { useState } from 'react';
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
import { Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

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
            <Route path="discuss" element={<DiscussPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
