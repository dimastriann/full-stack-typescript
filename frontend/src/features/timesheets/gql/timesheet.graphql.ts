import { gql } from '@apollo/client';

export const GET_TIMESHEETS = gql`
  query ($skip: Int, $take: Int, $taskId: Int) {
    timesheets(skip: $skip, take: $take, taskId: $taskId) {
      id
      description
      date
      timeSpent
      userId
      user {
        name
      }
      projectId
      project {
        name
      }
      taskId
      task {
        title
      }
    }
  }
`;

export const GET_TIMESHEET = gql`
  query ($id: Int!) {
    getTimesheet(id: $id) {
      id
      description
      date
      timeSpent
      userId
      projectId
      taskId
    }
  }
`;

export const CREATE_TIMESHEET = gql`
  mutation CreateTimesheet($input: CreateTimesheetInput!) {
    createTimesheet(createTimesheetInput: $input) {
      id
    }
  }
`;

export const UPDATE_TIMESHEET = gql`
  mutation UpdateTimesheet($input: UpdateTimesheetInput!) {
    updateTimesheet(updateTimesheetInput: $input) {
      id
    }
  }
`;

export const DELETE_TIMESHEET = gql`
  mutation RemoveTimesheet($id: Int!) {
    removeTimesheet(id: $id) {
      id
    }
  }
`;
