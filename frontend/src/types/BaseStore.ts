import { ApolloError } from '@apollo/client';
import type { UserType } from './Users';
import type { TaskType } from './Tasks';

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
}

export interface UserStoreModel extends BaseStore<UserType> {}

export interface TaskStoreModel extends BaseStore<TaskType> {}
