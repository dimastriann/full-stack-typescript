import { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';

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
  const [session, setSession] = useState<string>(
    sessionStorage.getItem('session_id') || '',
  );
  const [user, setUser] = useState<any>(
    JSON.parse(sessionStorage.getItem('user') || 'null'),
  );
  const navigate = useNavigate();
  const client = useApolloClient();

  const login = (loginData: any) => {
    // loginData contains { access_token, user }
    const token = loginData.access_token;
    const userData = loginData.user;

    sessionStorage.setItem('session_id', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setSession(token);
    setUser(userData);
    client.resetStore();
    navigate('/dashboard');
  };

  const logout = () => {
    sessionStorage.removeItem('session_id');
    sessionStorage.removeItem('user');
    setSession('');
    setUser(null);
    client.resetStore();
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ session, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
