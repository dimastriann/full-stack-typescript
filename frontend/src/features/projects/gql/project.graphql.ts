import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query {
    projects {
      id
      name
      description
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation ($createProjectInput: CreateProjectInput!) {
    createProject(createProjectInput: $createProjectInput) {
      id
      name
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation ($updateProjectInput: UpdateProjectInput!) {
    updateProject(updateProjectInput: $updateProjectInput) {
      id
      name
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation ($id: Int!) {
    deleteProject(id: $id) {
      id
    }
  }
`;
