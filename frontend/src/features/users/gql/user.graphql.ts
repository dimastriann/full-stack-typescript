import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers($skip: Int, $take: Int) {
    users(skip: $skip, take: $take) {
      id
      name
      email
      role
      status
      firstName
      lastName
      mobile
      birthDate
      address
      bio
    }
  }
`;

export const GET_USER = gql`
  query ($id: Int!) {
    getUser(id: $id) {
      id
      name
      email
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

export const UPDATE_USER = gql`
  mutation ($input: UpdateUserInput!) {
    updateUser(updateUserInput: $input) {
      id
      name
      email
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

export const DELETE_USER = gql`
  mutation ($id: Int!) {
    deleteUser(id: $id) {
      id
    }
  }
`;
