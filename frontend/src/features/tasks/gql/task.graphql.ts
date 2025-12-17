import { gql } from '@apollo/client';

export const GET_TASKS = gql`
  query GetTasks($skip: Int, $take: Int, $projectId: Int) {
    tasks(skip: $skip, take: $take, projectId: $projectId) {
      id
      title
      description
      status
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
      status
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
