import { create } from 'zustand';
import type { TaskType } from '../types/Tasks';

export interface TaskState {
  tasks: TaskType[];
  editingTask: TaskType | null;
  page: number;
  pageSize: number;
  setTasks: (tasks: TaskType[]) => void;
  setEditingTask: (task: TaskType | null) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  editingTask: null,
  page: 0,
  pageSize: 20,
  setTasks: (tasks) => set({ tasks }),
  setEditingTask: (task) => set({ editingTask: task }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
}));
