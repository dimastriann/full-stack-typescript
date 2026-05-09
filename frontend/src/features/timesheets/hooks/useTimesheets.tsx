import { useQuery, useMutation } from '@apollo/client';
import {
  CREATE_TIMESHEET,
  DELETE_TIMESHEET,
  UPDATE_TIMESHEET,
  GET_TIMESHEETS,
  APPROVE_TIMESHEET,
  REJECT_TIMESHEET,
} from '../gql/timesheet.graphql';
import { useEffect } from 'react';
import { useTimesheetStore } from '../../../store/timesheetStore';

export const useTimesheets = () => {
  const {
    timesheets,
    setTimesheets,
    editingTimesheet,
    setEditingTimesheet,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = useTimesheetStore();

  const { data, loading, error, refetch } = useQuery(GET_TIMESHEETS, {
    variables: { skip: page * pageSize, take: pageSize },
  });

  const [createTimesheet] = useMutation(CREATE_TIMESHEET);
  const [updateTimesheet] = useMutation(UPDATE_TIMESHEET);
  const [deleteTimesheet] = useMutation(DELETE_TIMESHEET);
  const [approveTimesheet] = useMutation(APPROVE_TIMESHEET);
  const [rejectTimesheet] = useMutation(REJECT_TIMESHEET);

  useEffect(() => {
    if (data?.timesheets) {
      setTimesheets(data.timesheets);
    }
  }, [data, setTimesheets]);

  return {
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
    approveRecord: approveTimesheet,
    rejectRecord: rejectTimesheet,
  };
};
