import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardStats from '../components/dashboard/DashboardStats';
import UserList from '../features/users/components/UserList';
import UserEditPage from '../features/users/pages/UserFormPage';
import { UserProvider } from '../features/users/hooks/useUsers';
import { TaskProvider } from '../features/tasks/hooks/useTasks';
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
import { ProjectProvider } from '../features/projects/hooks/useProjects';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">
              ProjectFlow
            </h1>
            <span className="md:hidden font-semibold text-lg text-gray-700">
              Dashboard
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <WorkspaceSwitcher />
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              {user?.firstName?.[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 bg-gray-100 overflow-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <div className="flex-1 overflow-y-auto p-6">
                  <DashboardStats />
                </div>
              }
            />
            {isAdmin ? (
              <>
                <Route
                  path="/users"
                  element={
                    <div className="flex-1 overflow-y-auto p-6">
                      <UserProvider>
                        <UserList />
                      </UserProvider>
                    </div>
                  }
                />
                <Route
                  path="/user/:userId"
                  element={
                    <div className="flex-1 overflow-y-auto p-6">
                      <UserProvider>
                        <UserEditPage />
                      </UserProvider>
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
                <div className="flex-1 flex flex-col min-h-0 p-6">
                  <ProjectProvider>
                    <ProjectKanban />
                  </ProjectProvider>
                </div>
              }
            />
            <Route
              path="/projects/list"
              element={
                <div className="flex-1 overflow-y-auto p-6">
                  <ProjectProvider>
                    <ProjectList />
                  </ProjectProvider>
                </div>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <div className="flex-1 overflow-y-auto p-6">
                  <ProjectProvider>
                    <ProjectEditPage />
                  </ProjectProvider>
                </div>
              }
            />
            <Route
              path="/tasks"
              element={
                <div className="flex-1 flex flex-col min-h-0 p-6">
                  <TaskProvider>
                    <ProjectProvider>
                      <TaskKanban />
                    </ProjectProvider>
                  </TaskProvider>
                </div>
              }
            />
            <Route
              path="/tasks/list"
              element={
                <div className="flex-1 overflow-y-auto p-6">
                  <TaskPage />
                </div>
              }
            />
            <Route
              path="task/:taskId"
              element={
                <div className="flex-1 overflow-y-auto p-6">
                  <TaskFormPage />
                </div>
              }
            />
            <Route
              path="timesheets"
              element={
                <div className="flex-1 overflow-y-auto p-6">
                  <TimesheetPage />
                </div>
              }
            />
            <Route
              path="timesheet/:timesheetId"
              element={
                <div className="flex-1 overflow-y-auto p-6">
                  <TimesheetFormPage />
                </div>
              }
            />
            <Route
              path="profile"
              element={
                <div className="flex-1 overflow-y-auto p-6">
                  <UserProvider>
                    <ProfilePage />
                  </UserProvider>
                </div>
              }
            />
            <Route
              path="workspace/settings"
              element={
                <div className="flex-1 overflow-y-auto p-6">
                  <WorkspaceSettingsPage />
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
