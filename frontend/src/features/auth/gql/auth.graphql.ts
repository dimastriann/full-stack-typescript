import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      access_token
      requiresTwoFactor
      preAuthToken
      user {
        id
        name
        email
        role
        twoFactorEnabled
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
        twoFactorEnabled
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
      twoFactorEnabled
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

export const SETUP_2FA_MUTATION = gql`
  mutation SetupTwoFactor {
    setupTwoFactor {
      secret
      otpauthUrl
    }
  }
`;

export const VERIFY_ENABLE_2FA_MUTATION = gql`
  mutation VerifyAndEnableTwoFactor($token: String!) {
    verifyAndEnableTwoFactor(token: $token) {
      enabled
      backupCodes
    }
  }
`;

export const DISABLE_2FA_MUTATION = gql`
  mutation DisableTwoFactor($token: String!) {
    disableTwoFactor(token: $token)
  }
`;

export const COMPLETE_2FA_LOGIN_MUTATION = gql`
  mutation CompleteTwoFactorLogin($preAuthToken: String!, $token: String!) {
    completeTwoFactorLogin(preAuthToken: $preAuthToken, token: $token) {
      access_token
      user {
        id
        name
        email
        role
        twoFactorEnabled
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
