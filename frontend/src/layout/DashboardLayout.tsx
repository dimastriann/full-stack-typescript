import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardStats from '../components/dashboard/DashboardStats';
import UserList from '../features/users/components/UserList';
import UserEditPage from '../features/users/pages/UserFormPage';
import { UserProvider } from '../features/users/hooks/useUsers';
import { ProjectProvider } from '../features/projects/hooks/useProjects';
import ProjectList from '../features/projects/components/ProjectList';
import ProjectKanban from '../features/projects/components/ProjectKanban';
import ProjectEditPage from '../features/projects/pages/ProjectFormPage';
import TemplateView from '../features/template/Template';
import TaskPage from '../features/tasks/pages/TaskPage';
import TaskFormPage from '../features/tasks/pages/TaskFormPage';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Routes>
            <Route path="/" element={<DashboardStats />} />
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
            <Route path="tasks" element={<TaskPage />} />
            <Route path="task/:taskId" element={<TaskFormPage />} />
            <Route path="template" element={<TemplateView />} />
            <Route path="profile" element={<TemplateView />} />
            <Route path="calendar" element={<TemplateView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
