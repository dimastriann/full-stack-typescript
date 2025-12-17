import { useQuery, useMutation } from '@apollo/client';
import {
  CREATE_TIMESHEET,
  DELETE_TIMESHEET,
  UPDATE_TIMESHEET,
  GET_TIMESHEETS,
} from '../gql/timesheet.graphql';
import type { TimesheetType } from '../../../types/Timesheets';
import { createContext, useState, useEffect, useContext } from 'react';
import type { TimesheetStoreModel } from '../../../types/BaseStore';

export const TimesheetContext = createContext<TimesheetStoreModel | undefined>(
  undefined,
);

export function TimesheetProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const { data, loading, error, refetch } = useQuery(GET_TIMESHEETS, {
    variables: { skip: page * pageSize, take: pageSize },
  });
  const [createTimesheet] = useMutation(CREATE_TIMESHEET);
  const [updateTimesheet] = useMutation(UPDATE_TIMESHEET);
  const [deleteTimesheet] = useMutation(DELETE_TIMESHEET);
  const [editingTimesheet, setEditingTimesheet] =
    useState<TimesheetType | null>(null);
  const [timesheets, setTimesheets] = useState<TimesheetType[]>([]);

  useEffect(() => {
    if (data) {
      setTimesheets(data?.timesheets || []);
    }
  }, [data]);

  const timesheetStore = {
    records: timesheets,
    loading,
    error,
    refetch,
    editingRecord: editingTimesheet,
    setEditingRecord: setEditingTimesheet,
    createRecord: createTimesheet,
    updateRecord: updateTimesheet,
    deleteRecord: deleteTimesheet,
    page,
    setPage,
    pageSize,
    setPageSize,
  };

  return (
    <TimesheetContext.Provider value={timesheetStore}>
      {children}
    </TimesheetContext.Provider>
  );
}

export const useTimesheets = () => {
  const context = useContext(TimesheetContext);
  if (!context) {
    throw new Error('useTimesheets must be used within a TimesheetProvider');
  }
  return context;
};
