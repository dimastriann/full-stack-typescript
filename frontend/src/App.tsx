// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import User from './features/users/UserPage';
import Project from './features/projects/pages/ProjectPage';
import TaskList from './features/tasks/TaskList';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/users" />} />
        <Route path="/users" element={<User />} />
        <Route path="/projects" element={<Project />} />
        <Route path="/tasks" element={<TaskList />} />
      </Route>
    </Routes>
  );
}
