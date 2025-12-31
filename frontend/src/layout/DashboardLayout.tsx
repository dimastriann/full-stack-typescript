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
import TemplateView from '../features/template/Template';
import TaskPage from '../features/tasks/pages/TaskPage';
import TaskFormPage from '../features/tasks/pages/TaskFormPage';
import TaskKanban from '../features/tasks/components/TaskKanban';
import TimesheetPage from '../features/timesheets/pages/TimesheetPage';
import TimesheetFormPage from '../features/timesheets/pages/TimesheetFormPage';
import ProfilePage from '../features/users/pages/ProfilePage';
import { ProjectProvider } from '../features/projects/hooks/useProjects';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-semibold text-lg text-gray-700">
            Dashboard
          </span>
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Routes>
            <Route path="/" element={<DashboardStats />} />
            {isAdmin ? (
              <>
                <Route
                  path="/users"
                  element={
                    <UserProvider>
                      <UserList />
                    </UserProvider>
                  }
                />
                <Route
                  path="/user/:userId"
                  element={
                    <UserProvider>
                      <UserEditPage />
                    </UserProvider>
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
                <ProjectProvider>
                  <ProjectKanban />
                </ProjectProvider>
              }
            />
            <Route
              path="/projects/list"
              element={
                <ProjectProvider>
                  <ProjectList />
                </ProjectProvider>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <ProjectProvider>
                  <ProjectEditPage />
                </ProjectProvider>
              }
            />
            <Route
              path="/tasks"
              element={
                <TaskProvider>
                  <TaskKanban />
                </TaskProvider>
              }
            />
            <Route path="/tasks/list" element={<TaskPage />} />
            <Route path="task/:taskId" element={<TaskFormPage />} />
            <Route path="timesheets" element={<TimesheetPage />} />
            <Route
              path="timesheet/:timesheetId"
              element={<TimesheetFormPage />}
            />
            <Route path="template" element={<TemplateView />} />
            <Route
              path="profile"
              element={
                <UserProvider>
                  <ProfilePage />
                </UserProvider>
              }
            />
            <Route path="calendar" element={<TemplateView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
