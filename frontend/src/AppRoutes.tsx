import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout from './layout/DashboardLayout';
import PublicLayout from './layout/PublicLayout';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/*" element={<DashboardLayout />} />
      </Route>
    </Routes>
  );
};
