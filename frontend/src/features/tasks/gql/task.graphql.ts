import { gql } from '@apollo/client';

export const GET_TASKS = gql`
  query {
    tasks {
      id
      title
      description
      status
      user {
        name
      }
      project {
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
  mutation UpdateTask($id: Int!, $input: UpdateTaskInput!) {
    updateTask(id: $id, updateTaskInput: $input) {
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
