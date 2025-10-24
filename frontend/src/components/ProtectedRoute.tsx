import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';

export const ProtectedRoute = () => {
  const { session } = useContext(AuthContext);
  console.info('session', session);
  return session ? <Outlet /> : <Navigate to="/login" />;
};
