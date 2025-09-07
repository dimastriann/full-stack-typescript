// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import DashboardLayout from './layout/DashboardLayout';
import Header from './components/Header';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/*" element={<DashboardLayout />} />
      </Routes>
    </div>
  );
}
