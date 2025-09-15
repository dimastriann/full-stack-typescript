import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

type AuthContext = {
  session: string;
  login: (val: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContext>({
  session: '',
  login: () => undefined,
  logout: () => undefined,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<string>('');
  const navigate = useNavigate();

  function setCookie(cname: string, cvalue: string, exdays: number) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = 'expires=' + d.toUTCString();
    document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
  }

  function getCookie(cname: string) {
    let name = cname + '=';
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  }

  useEffect(() => {
    const token = getCookie('session_id');
    if (token) {
      setSession(token);
    }
  }, []);

  const login = async (token: string) => {
    setCookie('session_id', token, 1);
    setSession(token);
    navigate('/dashboard');
  };

  const logout = () => {
    cookieStore.delete('session_id');
    setSession('');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
