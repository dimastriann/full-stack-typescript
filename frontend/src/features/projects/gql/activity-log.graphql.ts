import { gql } from '@apollo/client';

export const GET_ACTIVITY_LOGS = gql`
  query GetActivityLogs(
    $workspaceId: Int
    $projectId: Int
    $entityType: String
    $entityId: Int
    $skip: Int
    $take: Int
  ) {
    activityLogs(
      workspaceId: $workspaceId
      projectId: $projectId
      entityType: $entityType
      entityId: $entityId
      skip: $skip
      take: $take
    ) {
      id
      action
      entityType
      entityId
      workspaceId
      projectId
      userId
      details
      createdAt
      user {
        id
        name
      }
      project {
        id
        name
      }
    }
  }
`;
