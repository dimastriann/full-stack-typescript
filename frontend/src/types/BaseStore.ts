import { ApolloError } from '@apollo/client';
import type { UserType } from './Users';
import type { TaskType } from './Tasks';
import type { ProjectType } from './Projects';

export interface BaseStore<T> {
  records: T[];
  error: ApolloError | undefined;
  loading: boolean;
  refetch: Function;
  editingRecord: T | null;
  setEditingRecord: Function;
  createRecord: Function;
  updateRecord: Function;
  deleteRecord: Function;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
}

export interface UserStoreModel extends BaseStore<UserType> {}

export interface TaskStoreModel extends BaseStore<TaskType> {}

export interface ProjectStoreModel extends BaseStore<ProjectType> {}
