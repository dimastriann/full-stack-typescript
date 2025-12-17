// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './features/auth/pages/LoginPage';
import Header from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout from './layout/DashboardLayout';

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
