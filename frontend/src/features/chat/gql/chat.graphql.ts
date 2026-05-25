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
      unreadCount
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
      isEdited
      type
      fileUrl
      fileName
      fileSize
      mimeType
      metadata
      linkPreview {
        url
        title
        description
        image
        siteName
        favicons
      }
      attachments {
        id
        filename
        path
        mimeType
        size
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

export const MARK_AS_READ = gql`
  mutation MarkAsRead($conversationId: Int!) {
    markAsRead(conversationId: $conversationId)
  }
`;

export const UPDATE_MESSAGE = gql`
  mutation UpdateMessage($id: Int!, $content: String!) {
    updateMessage(id: $id, content: $content) {
      id
      content
      isEdited
      updatedAt
    }
  }
`;

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($id: Int!) {
    deleteMessage(id: $id)
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage(
    $conversationId: Int!
    $content: String!
    $type: MessageType
    $attachmentIds: [Int!]
    $metadata: String
  ) {
    sendMessage(
      conversationId: $conversationId
      content: $content
      type: $type
      attachmentIds: $attachmentIds
      metadata: $metadata
    ) {
      id
      content
      senderId
      sender {
        id
        name
      }
      createdAt
      isEdited
      type
      fileUrl
      fileName
      fileSize
      mimeType
      metadata
      linkPreview {
        url
        title
        description
        image
        siteName
        favicons
      }
      attachments {
        id
        filename
        path
        mimeType
        size
      }
    }
  }
`;

export const MESSAGE_SENT_SUBSCRIPTION = gql`
  subscription OnMessageSent($conversationId: Int!) {
    messageSent(conversationId: $conversationId) {
      id
      content
      senderId
      sender {
        id
        name
      }
      createdAt
      isEdited
      type
      fileUrl
      fileName
      fileSize
      mimeType
      metadata
      linkPreview {
        url
        title
        description
        image
        siteName
        favicons
      }
      attachments {
        id
        filename
        path
        mimeType
        size
      }
    }
  }
`;

export const MESSAGE_UPDATED_SUBSCRIPTION = gql`
  subscription OnMessageUpdated($conversationId: Int!) {
    messageUpdated(conversationId: $conversationId) {
      id
      content
      senderId
      sender {
        id
        name
      }
      createdAt
      isEdited
      type
      fileUrl
      fileName
      fileSize
      mimeType
      metadata
      linkPreview {
        url
        title
        description
        image
        siteName
        favicons
      }
      attachments {
        id
        filename
        path
        mimeType
        size
      }
    }
  }
`;

export const MESSAGE_DELETED_SUBSCRIPTION = gql`
  subscription OnMessageDeleted($conversationId: Int!) {
    messageDeleted(conversationId: $conversationId)
  }
`;
