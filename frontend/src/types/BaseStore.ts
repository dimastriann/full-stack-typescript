import { ApolloError } from '@apollo/client';
import type { UserType } from './Users';
import type { TaskType } from './Tasks';
import type { ProjectType } from './Projects';
import type { TimesheetType } from './Timesheets';

export interface BaseStore<T> {
  records: T[];
  error: ApolloError | undefined;
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: (...args: any[]) => any;
  editingRecord: T | null;
  setEditingRecord: (record: T | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createRecord: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateRecord: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteRecord: (...args: any[]) => any;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UserStoreModel extends BaseStore<UserType> { }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TaskStoreModel extends BaseStore<TaskType> { }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProjectStoreModel extends BaseStore<ProjectType> { }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TimesheetStoreModel extends BaseStore<TimesheetType> { }
