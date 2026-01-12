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
    '', // Session status managed by cookies now
  );
  const [user, setUser] = useState<any>(
    JSON.parse(sessionStorage.getItem('user') || 'null'),
  );
  const navigate = useNavigate();
  const client = useApolloClient();

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

  const logout = () => {
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
