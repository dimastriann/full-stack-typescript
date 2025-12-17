import { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

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
    localStorage.getItem('session_id') || '',
  );
  const [user, setUser] = useState<any>(
    JSON.parse(localStorage.getItem('user') || 'null'),
  );
  const navigate = useNavigate();

  const login = (userData: any) => {
    // For now, we simulate a token or just rely on the existence of user data
    // In a real app we'd get a token from the backend
    const token = 'simulated-token';
    localStorage.setItem('session_id', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setSession(token);
    setUser(userData);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('session_id');
    localStorage.removeItem('user');
    setSession('');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ session, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
