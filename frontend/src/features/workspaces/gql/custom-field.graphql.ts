import { gql } from '@apollo/client';

export const GET_CUSTOM_FIELD_DEFINITIONS = gql`
  query GetCustomFieldDefinitions($workspaceId: Int!, $entityType: String) {
    customFieldDefinitions(workspaceId: $workspaceId, entityType: $entityType) {
      id
      workspaceId
      entityType
      name
      type
      options
      isRequired
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_CUSTOM_FIELD_DEFINITION = gql`
  mutation CreateCustomFieldDefinition(
    $input: CreateCustomFieldDefinitionInput!
  ) {
    createCustomFieldDefinition(input: $input) {
      id
      workspaceId
      entityType
      name
      type
      options
      isRequired
    }
  }
`;

export const UPDATE_CUSTOM_FIELD_DEFINITION = gql`
  mutation UpdateCustomFieldDefinition(
    $id: Int!
    $input: UpdateCustomFieldDefinitionInput!
  ) {
    updateCustomFieldDefinition(id: $id, input: $input) {
      id
      workspaceId
      entityType
      name
      type
      options
      isRequired
    }
  }
`;

export const DELETE_CUSTOM_FIELD_DEFINITION = gql`
  mutation DeleteCustomFieldDefinition($id: Int!) {
    deleteCustomFieldDefinition(id: $id) {
      id
    }
  }
`;

export const GET_CUSTOM_FIELD_VALUES = gql`
  query GetCustomFieldValues($entityId: Int!, $workspaceId: Int!) {
    customFieldValues(entityId: $entityId, workspaceId: $workspaceId) {
      id
      fieldId
      entityId
      value
      field {
        id
        name
        type
        options
        isRequired
      }
    }
  }
`;

export const UPSERT_CUSTOM_FIELD_VALUE = gql`
  mutation UpsertCustomFieldValue($input: UpsertCustomFieldValueInput!) {
    upsertCustomFieldValue(input: $input) {
      id
      fieldId
      entityId
      value
    }
  }
`;

export const DELETE_CUSTOM_FIELD_VALUE = gql`
  mutation DeleteCustomFieldValue($id: Int!) {
    deleteCustomFieldValue(id: $id) {
      id
    }
  }
`;
