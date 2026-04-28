import { create } from 'zustand';

export interface AuthState {
  session: string;
  user: any;
  loading: boolean;
  setAuth: (user: any, session: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

const getInitialUser = () => {
  const storedUser = sessionStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) : null;
};

export const useAuthStore = create<AuthState>((set) => {
  const initialUser = getInitialUser();
  return {
    session: initialUser ? 'logged_in' : '',
    user: initialUser,
    loading: !initialUser, // only load if we don't have a user locally
    setAuth: (user, session) => {
      sessionStorage.setItem('user', JSON.stringify(user));
      set({ user, session, loading: false });
    },
    clearAuth: () => {
      sessionStorage.removeItem('user');
      localStorage.removeItem('lastWorkspaceId');
      set({ user: null, session: '', loading: false });
    },
    setLoading: (loading) => set({ loading }),
  };
});
