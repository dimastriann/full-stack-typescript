import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import { GET_ME, LOGOUT_MUTATION } from '../features/auth/gql/auth.graphql';

type AuthContext = {
  session: string;
  user: any;
  login: (userData: any) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContext>({
  session: '',
  user: null,
  login: () => undefined,
  logout: () => undefined,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const client = useApolloClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await client.query({
          query: GET_ME,
          fetchPolicy: 'network-only',
        });
        if (data?.me) {
          setUser(data.me);
          setSession('logged_in');
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [client]);

  const login = (loginData: any) => {
    // loginData contains { access_token, user }
    // access_token is now set in httpOnly cookie by backend
    const userData = loginData.user;

    sessionStorage.setItem('user', JSON.stringify(userData));
    setSession('logged_in'); // Placeholder to indicate logged in state
    setUser(userData);
    client.resetStore();
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      await client.mutate({ mutation: LOGOUT_MUTATION });
    } catch (error) {
      console.error('Logout mutation failed:', error);
    }
    sessionStorage.removeItem('user');
    setSession('');
    setUser(null);
    client.resetStore();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
