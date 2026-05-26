import { gql } from '@apollo/client';

export const GET_CALENDAR_TASKS = gql`
  query GetCalendarTasks($workspaceId: Int, $skip: Int, $take: Int) {
    tasks(skip: $skip, take: $take) {
      id
      title
      priority
      dueDate
      startDate
      completedAt
      progress
      stage {
        id
        title
        color
        isCompleted
      }
      project {
        id
        name
      }
      user {
        id
        name
        firstName
      }
    }
  }
`;
