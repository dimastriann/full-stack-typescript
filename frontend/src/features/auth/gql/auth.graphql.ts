import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      access_token
      user {
        id
        name
        email
        role
        workspaceMembers {
          id
          role
          workspace {
            id
            name
            description
          }
        }
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($createUserInput: CreateUserInput!) {
    register(createUserInput: $createUserInput) {
      access_token
      user {
        id
        email
        name
        role
        firstName
        lastName
        workspaceMembers {
          id
          role
          workspace {
            id
            name
            description
          }
        }
      }
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      role
      firstName
      lastName
      workspaceMembers {
        id
        role
        workspace {
          id
          name
          description
        }
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;
