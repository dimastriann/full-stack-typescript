import { useQuery, useMutation } from '@apollo/client';
import {
  GET_USERS,
  GET_USER,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
} from '../gql/user.graphql';
import type { UserType } from '../../../types/Users';
import { createContext, useState, useEffect, useContext } from 'react';
import type { UserStoreModel } from '../../../types/BaseStore';

// interface UserStore {
//   users: UserType[];
//   error: ApolloError | undefined;
//   loading: boolean;
//   refetch: Function;
//   editingUser: UserType | null;
//   setEditingUser: Function;
//   createUser: Function;
//   updateUser: Function;
//   deleteUser: Function;
// }

// const defaultUserInput = {
//   name: '',
//   email: '',
//   password: '',
//   status: true,
// };

export const UserContext = createContext<UserStoreModel>({
  records: [],
  error: undefined,
  loading: false,
  refetch: () => {},
  editingRecord: null,
  setEditingRecord: () => {},
  createRecord: () => {},
  updateRecord: () => {},
  deleteRecord: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error, refetch } = useQuery(GET_USERS);
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
  };

  return (
    <UserContext.Provider value={userStore}>{children}</UserContext.Provider>
  );
}

export const useUserContext = () => useContext(UserContext);
