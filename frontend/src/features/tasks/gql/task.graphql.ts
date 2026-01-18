import { gql } from '@apollo/client';

export const GET_TASKS = gql`
  query GetTasks($skip: Int, $take: Int, $projectId: Int) {
    tasks(skip: $skip, take: $take, projectId: $projectId) {
      id
      title
      description
      stageId
      sequence
      stage {
        id
        title
        color
      }
      user {
        name
      }
      project {
        id
        name
      }
    }
  }
`;

export const GET_TASK = gql`
  query ($id: Int!) {
    getTask(id: $id) {
      id
      title
      description
      stageId
      sequence
      stage {
        id
        title
        color
        isCompleted
        isCanceled
      }
      userId
      projectId
      user {
        id
        name
      }
      project {
        id
        name
      }
      comments {
        id
        content
        createdAt
        user {
          id
          name
        }
        replies {
          id
          content
          createdAt
          user {
            id
            name
          }
        }
      }
      attachments {
        id
        filename
        path
        mimeType
        size
      }
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(createTaskInput: $input) {
      id
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(updateTaskInput: $input) {
      id
      title
      stageId
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: Int!) {
    removeTask(id: $id) {
      id
    }
  }
`;

export const GET_TASK_STAGES = gql`
  query GetTaskStages($workspaceId: Int!) {
    taskStages(workspaceId: $workspaceId) {
      id
      title
      color
      sequence
      isCompleted
    }
  }
`;
