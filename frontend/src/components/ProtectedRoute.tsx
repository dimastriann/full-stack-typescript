import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = () => {
  const session = useAuthStore((state) => state.session);
  return session ? <Outlet /> : <Navigate to="/login" />;
};
