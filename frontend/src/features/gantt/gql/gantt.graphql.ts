import { gql } from '@apollo/client';

export const GET_GANTT_TASKS = gql`
  query GetGanttTasks($projectId: Int, $skip: Int, $take: Int) {
    tasks(skip: $skip, take: $take, projectId: $projectId) {
      id
      title
      priority
      progress
      startDate
      dueDate
      completedAt
      estimatedHours
      type
      stage {
        id
        title
        color
        isCompleted
      }
      user {
        id
        name
        firstName
      }
      project {
        id
        name
      }
      parentTaskId
    }
  }
`;

export const GET_GANTT_PROJECTS = gql`
  query GetGanttProjects($workspaceId: Int) {
    projects(workspaceId: $workspaceId) {
      id
      name
      startDate
      endDate
      progress
      stage {
        id
        title
        color
      }
    }
  }
`;
