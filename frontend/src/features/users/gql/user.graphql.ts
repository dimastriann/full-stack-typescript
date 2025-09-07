import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query {
    users {
      id
      name
      email
      password
      phone
      mobile
      firstName
      lastName
      status
      address
      bio
      birthDate
      role
    }
  }
`;

export const GET_USER = gql`
  query ($id: Int!) {
    getUser(id: $id) {
      id
      name
      email
      password
      phone
      mobile
      firstName
      lastName
      status
      address
      bio
      birthDate
      role
    }
  }
`;

export const CREATE_USER = gql`
  mutation ($input: CreateUserInput!) {
    createUser(createUserInput: $input) {
      id
      name
      email
    }
  }
`;

export const UPDATE_USER = gql`
  mutation ($id: Int!, $input: CreateUserInput!) {
    updateUser(id: $id, updateUserInput: $input) {
      id
      name
      email
    }
  }
`;

export const DELETE_USER = gql`
  mutation ($id: Int!) {
    deleteUser(id: $id) {
      id
    }
  }
`;
