import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects($skip: Int, $take: Int) {
    projects(skip: $skip, take: $take) {
      id
      name
      description
      status
      responsibleId
      responsible {
        id
        name
      }
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation ($createProjectInput: CreateProjectInput!) {
    createProject(createProjectInput: $createProjectInput) {
      id
      name
      description
      status
      responsibleId
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation ($updateProjectInput: UpdateProjectInput!) {
    updateProject(updateProjectInput: $updateProjectInput) {
      id
      name
      description
      status
      responsibleId
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
