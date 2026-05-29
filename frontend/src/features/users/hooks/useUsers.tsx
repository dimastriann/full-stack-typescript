import { useQuery, useMutation } from '@apollo/client';
import {
  GET_USERS,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
} from '../gql/user.graphql';
import { useEffect } from 'react';
import { useUserStore } from '../../../store/userStore';

export const useUserContext = () => {
  const {
    users,
    setUsers,
    editingUser,
    setEditingUser,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = useUserStore();

  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    variables: { skip: page * pageSize, take: pageSize },
  });

  const [createUser] = useMutation(CREATE_USER);
  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);

  useEffect(() => {
    if (data?.users) {
      setUsers(data.users);
    }
  }, [data, setUsers]);

  return {
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
};
