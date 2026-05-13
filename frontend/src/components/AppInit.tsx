import { useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { GET_ME } from '../features/auth/gql/auth.graphql';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import Logger from '../lib/logger';

export const AppInit = ({ children }: { children: React.ReactNode }) => {
  const client = useApolloClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoadingAuth = useAuthStore((state) => state.setLoading);
  const loadingAuth = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await client.query({
          query: GET_ME,
          fetchPolicy: 'network-only',
        });
        if (data?.me) {
          setAuth(data.me, 'logged_in');
        } else {
          setLoadingAuth(false);
        }
      } catch (error) {
        Logger.error('Session check failed:', error);
        setLoadingAuth(false);
      }
    };

    checkSession();
  }, [client, setAuth, setLoadingAuth]);

  useEffect(() => {
    if (user && user.workspaceMembers) {
      const availableWorkspaces = user.workspaceMembers.map(
        (m: any) => m.workspace,
      );
      setWorkspaces(availableWorkspaces);
    }
  }, [user, setWorkspaces]);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};
