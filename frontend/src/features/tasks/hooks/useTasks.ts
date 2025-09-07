import { useQuery, useMutation } from '@apollo/client';
import {
  GET_TASKS,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
} from '../gql/task.graphql';

export default function useTasks() {
  const { data, loading, error, refetch } = useQuery(GET_TASKS);
  const [createTask] = useMutation(CREATE_TASK);
  const [updateTask] = useMutation(UPDATE_TASK);
  const [deleteTask] = useMutation(DELETE_TASK);

  return {
    tasks: data?.tasks || [],
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch,
  };
}
