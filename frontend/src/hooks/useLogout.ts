import { useApolloClient } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { LOGOUT_MUTATION } from '../features/auth/gql/auth.graphql';
import { useAuthStore } from '../store/authStore';
import Logger from '../lib/logger';

export const useLogout = () => {
  const client = useApolloClient();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logout = async () => {
    try {
      await client.mutate({ mutation: LOGOUT_MUTATION });
    } catch (error) {
      Logger.error('Logout mutation failed:', error);
    }

    // Clear Zustand store and storage
    clearAuth();

    // Reset Apollo store
    await client.resetStore();

    // Navigate to login
    navigate('/login');
  };

  return logout;
};
