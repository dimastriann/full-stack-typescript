import { gql } from '@apollo/client';

export const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($createWorkspaceInput: CreateWorkspaceInput!) {
    createWorkspace(createWorkspaceInput: $createWorkspaceInput) {
      id
      name
      description
    }
  }
`;

export const UPDATE_WORKSPACE = gql`
  mutation UpdateWorkspace($updateWorkspaceInput: UpdateWorkspaceInput!) {
    updateWorkspace(updateWorkspaceInput: $updateWorkspaceInput) {
      id
      name
      description
    }
  }
`;

export const REMOVE_WORKSPACE = gql`
  mutation RemoveWorkspace($id: Int!) {
    removeWorkspace(id: $id) {
      id
    }
  }
`;

export const GET_WORKSPACE = gql`
  query GetWorkspace($id: Int!) {
    workspace(id: $id) {
      id
      name
      description
      members {
        id
        userId
        role
        user {
          id
          name
          email
        }
      }
    }
  }
`;

export const CREATE_PROJECT_STAGE = gql`
  mutation CreateProjectStage(
    $createProjectStageInput: CreateProjectStageInput!
  ) {
    createProjectStage(createProjectStageInput: $createProjectStageInput) {
      id
      title
      sequence
      color
    }
  }
`;

export const UPDATE_PROJECT_STAGE = gql`
  mutation UpdateProjectStage(
    $updateProjectStageInput: UpdateProjectStageInput!
  ) {
    updateProjectStage(updateProjectStageInput: $updateProjectStageInput) {
      id
      title
      sequence
      color
    }
  }
`;

export const REMOVE_PROJECT_STAGE = gql`
  mutation RemoveProjectStage($id: Int!) {
    removeProjectStage(id: $id) {
      id
    }
  }
`;

export const CREATE_TASK_STAGE = gql`
  mutation CreateTaskStage($createTaskStageInput: CreateTaskStageInput!) {
    createTaskStage(createTaskStageInput: $createTaskStageInput) {
      id
      title
      sequence
      color
    }
  }
`;

export const UPDATE_TASK_STAGE = gql`
  mutation UpdateTaskStage($updateTaskStageInput: UpdateTaskStageInput!) {
    updateTaskStage(updateTaskStageInput: $updateTaskStageInput) {
      id
      title
      sequence
      color
    }
  }
`;

export const REMOVE_TASK_STAGE = gql`
  mutation RemoveTaskStage($id: Int!) {
    removeTaskStage(id: $id) {
      id
    }
  }
`;

export const INVITE_TO_WORKSPACE = gql`
  mutation InviteToWorkspace($input: InviteToWorkspaceInput!) {
    inviteToWorkspace(input: $input) {
      id
      userId
      role
      user {
        id
        name
        email
      }
    }
  }
`;

export const UPDATE_WORKSPACE_MEMBER_ROLE = gql`
  mutation UpdateWorkspaceMemberRole($input: UpdateWorkspaceMemberRoleInput!) {
    updateWorkspaceMemberRole(input: $input) {
      id
      userId
      role
    }
  }
`;

export const REMOVE_WORKSPACE_MEMBER = gql`
  mutation RemoveWorkspaceMember($input: RemoveWorkspaceMemberInput!) {
    removeMemberFromWorkspace(input: $input) {
      id
    }
  }
`;
