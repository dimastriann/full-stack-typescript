import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout from './layout/DashboardLayout';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/*" element={<DashboardLayout />} />
      </Route>
    </Routes>
  );
};
