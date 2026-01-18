import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects($skip: Int, $take: Int, $workspaceId: Int) {
    projects(skip: $skip, take: $take, workspaceId: $workspaceId) {
      id
      name
      description
      workspaceId
      stageId
      sequence
      stage {
        id
        title
        color
      }
      responsibleId
      responsible {
        id
        name
      }
      members {
        id
        role
        user {
          id
        }
      }
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: Int!) {
    project(id: $id) {
      id
      name
      description
      workspaceId
      stageId
      sequence
      stage {
        id
        title
        color
        isCompleted
        isCanceled
      }
      responsibleId
      responsible {
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
      members {
        id
        role
        joinedAt
        user {
          id
          firstName
          lastName
          email
        }
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
      workspaceId
      stageId
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
      stageId
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

export const GET_PROJECT_STAGES = gql`
  query GetProjectStages($workspaceId: Int!) {
    projectStages(workspaceId: $workspaceId) {
      id
      title
      color
      sequence
      isCompleted
      isCanceled
    }
  }
`;
