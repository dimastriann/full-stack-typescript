import { useQuery, useMutation } from '@apollo/client';
import {
  CREATE_TASK,
  DELETE_TASK,
  UPDATE_TASK,
  GET_TASKS,
} from '../gql/task.graphql';
import { useEffect } from 'react';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useTaskStore } from '../../../store/taskStore';

export const useTasks = () => {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const {
    tasks,
    setTasks,
    editingTask,
    setEditingTask,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = useTaskStore();

  const { data, loading, error, refetch } = useQuery(GET_TASKS, {
    variables: { skip: page * pageSize, take: pageSize },
    skip: !activeWorkspace,
  });

  const [createTask] = useMutation(CREATE_TASK);
  const [updateTask] = useMutation(UPDATE_TASK);
  const [deleteTask] = useMutation(DELETE_TASK);

  useEffect(() => {
    if (data?.tasks) {
      setTasks(data.tasks);
    }
  }, [data, setTasks]);

  return {
    records: tasks,
    loading,
    error,
    refetch,
    editingRecord: editingTask,
    setEditingRecord: setEditingTask,
    createRecord: createTask,
    updateRecord: updateTask,
    deleteRecord: deleteTask,
    setRecords: setTasks,
    page,
    setPage,
    pageSize,
    setPageSize,
  };
};
