import { useQuery, useMutation } from '@apollo/client';
import {
  GET_USERS,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
} from '../gql/user.graphql';
import type { UserType } from '../../../types/Users';
import { createContext, useState, useEffect, useContext } from 'react';
import type { UserStoreModel } from '../../../types/BaseStore';

export const UserContext = createContext<UserStoreModel | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    variables: { skip: page * pageSize, take: pageSize },
  });
  // console.info('use query', data);
  const [createUser] = useMutation(CREATE_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);

  useEffect(() => {
    if (data) {
      setUsers(data?.users || []);
    }
  }, [data]);

  const userStore = {
    records: users,
    loading,
    error,
    refetch,
    editingRecord: editingUser,
    setEditingRecord: setEditingUser,
    createRecord: createUser,
    updateRecord: updateUser,
    deleteRecord: deleteUser,
    page,
    setPage,
    pageSize,
    setPageSize,
  };

  return (
    <UserContext.Provider value={userStore}>{children}</UserContext.Provider>
  );
}

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
