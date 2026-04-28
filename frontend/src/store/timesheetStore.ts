import { create } from 'zustand';
import type { TimesheetType } from '../types/Timesheets';

export interface TimesheetState {
  timesheets: TimesheetType[];
  editingTimesheet: TimesheetType | null;
  page: number;
  pageSize: number;
  setTimesheets: (timesheets: TimesheetType[]) => void;
  setEditingTimesheet: (timesheet: TimesheetType | null) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export const useTimesheetStore = create<TimesheetState>((set) => ({
  timesheets: [],
  editingTimesheet: null,
  page: 0,
  pageSize: 20,
  setTimesheets: (timesheets) => set({ timesheets }),
  setEditingTimesheet: (timesheet) => set({ editingTimesheet: timesheet }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
}));
