// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import DashboardLayout from './layout/DashboardLayout';
import Header from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/*" element={<DashboardLayout />} />
        </Route>
      </Routes>
    </div>
  );
}
