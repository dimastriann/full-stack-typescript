import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import PublicLayout from './layout/PublicLayout';

// Lazy load route pages
const HomePage = lazy(() => import('./pages/Home'));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage'));
const DashboardLayout = lazy(() => import('./layout/DashboardLayout'));

// Stylish modern loader component
const RouteLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    background: 'transparent',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(99, 102, 241, 0.1)',
      borderTop: '3px solid #6366f1',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
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
    </Suspense>
  );
};

