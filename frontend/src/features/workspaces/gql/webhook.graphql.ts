import { gql } from '@apollo/client';

export const GET_WEBHOOK_ENDPOINTS = gql`
  query GetWebhookEndpoints($workspaceId: Int!) {
    webhookEndpoints(workspaceId: $workspaceId) {
      id
      workspaceId
      url
      name
      secret
      events
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_WEBHOOK_DELIVERY_LOGS = gql`
  query GetWebhookDeliveryLogs($endpointId: Int!) {
    webhookDeliveryLogs(endpointId: $endpointId) {
      id
      webhookEndpointId
      event
      payload
      statusCode
      responseBody
      durationMs
      success
      createdAt
    }
  }
`;

export const CREATE_WEBHOOK_ENDPOINT = gql`
  mutation CreateWebhookEndpoint($input: CreateWebhookInput!) {
    createWebhookEndpoint(input: $input) {
      id
      workspaceId
      url
      name
      secret
      events
      isActive
      createdAt
    }
  }
`;

export const UPDATE_WEBHOOK_ENDPOINT = gql`
  mutation UpdateWebhookEndpoint($input: UpdateWebhookInput!) {
    updateWebhookEndpoint(input: $input) {
      id
      workspaceId
      url
      name
      secret
      events
      isActive
      createdAt
    }
  }
`;

export const DELETE_WEBHOOK_ENDPOINT = gql`
  mutation DeleteWebhookEndpoint($id: Int!) {
    deleteWebhookEndpoint(id: $id) {
      id
    }
  }
`;

export const TEST_WEBHOOK_ENDPOINT = gql`
  mutation TestWebhookEndpoint($id: Int!) {
    testWebhookEndpoint(id: $id) {
      id
      webhookEndpointId
      event
      payload
      statusCode
      responseBody
      durationMs
      success
      createdAt
    }
  }
`;
