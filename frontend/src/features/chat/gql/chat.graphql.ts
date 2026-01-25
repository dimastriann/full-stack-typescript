import { gql } from '@apollo/client';

export const GET_MY_CONVERSATIONS = gql`
  query GetMyConversations {
    myConversations {
      id
      name
      type
      workspaceId
      participants {
        id
        userId
        user {
          id
          name
        }
      }
      messages {
        id
        content
        createdAt
      }
    }
  }
`;

export const GET_CONVERSATION_MESSAGES = gql`
  query GetConversationMessages(
    $conversationId: Int!
    $limit: Int
    $cursor: Int
  ) {
    conversationMessages(
      conversationId: $conversationId
      limit: $limit
      cursor: $cursor
    ) {
      id
      content
      senderId
      sender {
        id
        name
      }
      createdAt
      linkPreview {
        url
        title
        description
        image
        siteName
        favicons
      }
    }
  }
`;

export const CREATE_DIRECT_CONVERSATION = gql`
  mutation CreateDirectConversation($otherUserId: Int!) {
    createDirectConversation(otherUserId: $otherUserId) {
      id
      type
      participants {
        id
        user {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_CHANNEL = gql`
  mutation CreateChannel(
    $name: String!
    $workspaceId: Int!
    $userIds: [Int!]!
  ) {
    createChannel(name: $name, workspaceId: $workspaceId, userIds: $userIds) {
      id
      name
      type
      workspaceId
      participants {
        id
        user {
          id
          name
        }
      }
    }
  }
`;

export const DELETE_CONVERSATION = gql`
  mutation DeleteConversation($id: Int!) {
    deleteConversation(id: $id)
  }
`;

export const ADD_PARTICIPANT = gql`
  mutation AddParticipant($conversationId: Int!, $userId: Int!) {
    addParticipant(conversationId: $conversationId, userId: $userId) {
      id
      userId
      user {
        id
        name
      }
    }
  }
`;

export const REMOVE_PARTICIPANT = gql`
  mutation RemoveParticipant($conversationId: Int!, $userId: Int!) {
    removeParticipant(conversationId: $conversationId, userId: $userId)
  }
`;
