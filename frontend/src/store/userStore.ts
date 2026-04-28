import { create } from 'zustand';
import type { UserType } from '../types/Users';

export interface UserState {
  users: UserType[];
  editingUser: UserType | null;
  page: number;
  pageSize: number;
  setUsers: (users: UserType[]) => void;
  setEditingUser: (user: UserType | null) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  editingUser: null,
  page: 0,
  pageSize: 20,
  setUsers: (users) => set({ users }),
  setEditingUser: (user) => set({ editingUser: user }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
}));
