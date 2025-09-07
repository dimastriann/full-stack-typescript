import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { create } from 'zustand';
import {
  GET_USERS,
  GET_USER,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
} from '../gql/user.graphql';
import type { UserType } from '../../../types/Users';
import { client } from '../../../apollo';
import React from 'react';

interface UserStore {
  users: UserType[];
  error: ApolloError | undefined;
  loading: boolean;
  editingUser: object;
  setEditingUser: (val: boolean, user?: UserType) => void;
  setUsers: (users: UserType[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApolloError | undefined) => void;
}

const defaultUserInput = {
  name: '',
  email: '',
  password: '',
  status: true,
};

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  error: undefined,
  editingUser: {},
  setEditingUser: (val: boolean, user: UserType = defaultUserInput) =>
    set(() => ({ editingUser: user, userInput: user })),
  setUsers: (users: UserType[]) => set({ users }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: ApolloError | undefined) => set({ error }),
}));

export default function useUsers() {
  const { data, loading, error, refetch } = useQuery(GET_USERS);

  const [createUser] = useMutation(CREATE_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);

  // Sync Apollo data with Zustand store - optimized with useCallback
  const setUsers = useUserStore((state) => state.setUsers);
  const setLoading = useUserStore((state) => state.setLoading);
  const setError = useUserStore((state) => state.setError);

  // Memoize the update functions to prevent unnecessary re-renders
  const updateStore = React.useCallback(() => {
    setUsers(data?.users || []);
    setLoading(loading);
    setError(error);
  }, [data?.users, loading, error, setUsers, setLoading, setError]);

  // Update Zustand store when Apollo data changes
  React.useEffect(() => {
    updateStore();
  }, [updateStore]);

  // Memoize the return object to prevent unnecessary re-renders
  const result = React.useMemo(
    () => ({
      users: data?.users || [],
      loading,
      error,
      refetch,
      createUser,
      updateUser,
      deleteUser,
    }),
    [data?.users, loading, error, refetch, createUser, updateUser, deleteUser],
  );

  return result;
}
