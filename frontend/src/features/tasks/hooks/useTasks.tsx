import { useQuery, useMutation } from '@apollo/client';
import {
  CREATE_TASK,
  DELETE_TASK,
  UPDATE_TASK,
  GET_TASKS,
} from '../gql/task.graphql';
import type { TaskType } from '../../../types/Tasks';
import { createContext, useState, useEffect, useContext } from 'react';
import type { TaskStoreModel } from '../../../types/BaseStore';

export const TaskContext = createContext<TaskStoreModel | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const { data, loading, error, refetch } = useQuery(GET_TASKS, {
    variables: { skip: page * pageSize, take: pageSize },
  });
  const [createTask] = useMutation(CREATE_TASK);
  const [updateTask] = useMutation(UPDATE_TASK);
  const [deleteTask] = useMutation(DELETE_TASK);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [tasks, setTasks] = useState<TaskType[]>([]);

  useEffect(() => {
    if (data) {
      setTasks(data?.tasks || []);
    }
  }, [data]);

  const taskStore = {
    records: tasks,
    loading,
    error,
    refetch,
    editingRecord: editingTask,
    setEditingRecord: setEditingTask,
    createRecord: createTask,
    updateRecord: updateTask,
    deleteRecord: deleteTask,
    page,
    setPage,
    pageSize,
    setPageSize,
  };

  return (
    <TaskContext.Provider value={taskStore}>{children}</TaskContext.Provider>
  );
}

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
