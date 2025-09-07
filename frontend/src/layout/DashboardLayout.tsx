import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserPage from '../features/users/pages/UserPage';
import ProjectPage from '../features/projects/pages/ProjectPage';
import TaskPage from '../features/tasks/pages/TaskPage';
import TemplateView from '../features/template/Template';
import UserForm from '../features/users/components/UserForm';

export default function DashboardLayout() {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 bg-gray-100 p-6 w-full">
        <Routes>
          <Route path="" element={<Navigate to="users" />} />
          <Route path="users" element={<UserPage />} />
          <Route path="user/:userId" element={<UserForm />} />
          <Route path="projects" element={<ProjectPage />} />
          <Route path="project/:projectId" element={<ProjectPage />} />
          <Route path="tasks" element={<TaskPage />} />
          <Route path="task/:taskId" element={<TaskPage />} />
          <Route path="template" element={<TemplateView />} />
          <Route path="profile" element={<TemplateView />} />
          <Route path="calendar" element={<TemplateView />} />
          <Route path="blank" element={<TemplateView />} />
          <Route path="reports" element={<TemplateView />} />
        </Routes>
      </main>
    </div>
  );
}
