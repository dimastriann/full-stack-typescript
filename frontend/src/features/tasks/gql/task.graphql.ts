import { gql } from '@apollo/client';

export const GET_TASKS = gql`
  query GetTasks($skip: Int, $take: Int, $projectId: Int) {
    tasks(skip: $skip, take: $take, projectId: $projectId) {
      id
      title
      description
      stageId
      sequence
      type
      priority
      estimatedHours
      actualHours
      remainingHours
      progress
      dueDate
      startDate
      completedAt
      tags
      stage {
        id
        title
        color
      }
      user {
        name
      }
      reporter {
        name
      }
      project {
        id
        name
      }
      parentTaskId
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
      type
      priority
      estimatedHours
      actualHours
      remainingHours
      progress
      dueDate
      startDate
      completedAt
      tags
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
      reporterId
      reporter {
        id
        name
      }
      project {
        id
        name
      }
      parentTaskId
      parentTask {
        id
        title
      }
      subtasks {
        id
        title
        type
        priority
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
      type
      priority
      estimatedHours
      remainingHours
      progress
      dueDate
      startDate
      completedAt
      tags
      parentTaskId
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
