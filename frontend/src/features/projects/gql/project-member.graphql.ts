import { gql } from '@apollo/client';

export const GET_PROJECT_MEMBERS = gql`
  query GetProjectMembers($projectId: Int!) {
    projectMembers(projectId: $projectId) {
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
`;

export const GET_MY_ROLE_IN_PROJECT = gql`
  query GetMyRoleInProject($projectId: Int!) {
    myRoleInProject(projectId: $projectId)
  }
`;

export const INVITE_TO_PROJECT = gql`
  mutation InviteToProject($input: InviteToProjectInput!) {
    inviteToProject(input: $input) {
      id
      role
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export const UPDATE_MEMBER_ROLE = gql`
  mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
    updateMemberRole(input: $input) {
      id
      role
    }
  }
`;

export const REMOVE_MEMBER = gql`
  mutation RemoveMemberFromProject($input: RemoveMemberInput!) {
    removeMemberFromProject(input: $input) {
      id
    }
  }
`;

export const LEAVE_PROJECT = gql`
  mutation LeaveProject($projectId: Int!) {
    leaveProject(projectId: $projectId) {
      id
    }
  }
`;
