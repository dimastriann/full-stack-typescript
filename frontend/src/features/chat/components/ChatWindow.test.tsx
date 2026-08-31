import { render, screen, waitFor } from '@testing-library/react';
import { useQuery } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { ChatWindow } from './ChatWindow';
import { useAuthStore } from '../../../store/authStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  GET_CONVERSATION_MESSAGES,
  GET_MY_CONVERSATIONS,
  MARK_AS_READ,
  MESSAGE_DELETED_SUBSCRIPTION,
  MESSAGE_SENT_SUBSCRIPTION,
  MESSAGE_UPDATED_SUBSCRIPTION,
} from '../gql/chat.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';

// Mock hooks and services
vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../lib/socket', () => ({
  socketService: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

function ChatTestHarness({ conversation }: { conversation: any }) {
  useQuery(GET_MY_CONVERSATIONS);
  return <ChatWindow conversation={conversation} />;
}

describe('ChatWindow', () => {
  const conversationListResult = vi.fn(() => ({
    data: { myConversations: [] },
  }));
  const mockConversation: any = {
    id: 1,
    name: 'Test Room',
    participants: [
      {
        id: 101,
        userId: 1,
        user: { id: 1, name: 'Sender', email: 'sender@test.com' },
      },
      {
        id: 102,
        userId: 2,
        user: { id: 2, name: 'Recipient', email: 'recipient@test.com' },
      },
    ],
  };

  const subscriptionMocks = [
    {
      request: {
        query: MESSAGE_SENT_SUBSCRIPTION,
        variables: { conversationId: 1 },
      },
      result: { data: { messageSent: null } },
    },
    {
      request: {
        query: MESSAGE_UPDATED_SUBSCRIPTION,
        variables: { conversationId: 1 },
      },
      result: { data: { messageUpdated: null } },
    },
    {
      request: {
        query: MESSAGE_DELETED_SUBSCRIPTION,
        variables: { conversationId: 1 },
      },
      result: { data: { messageDeleted: null } },
    },
  ];

  const conversationListMock = {
    request: { query: GET_MY_CONVERSATIONS },
    result: conversationListResult,
    maxUsageCount: 2,
  };

  const apolloMocks = [
    {
      request: {
        query: GET_CONVERSATION_MESSAGES,
        variables: { conversationId: 1 },
      },
      result: {
        data: {
          conversationMessages: [
            {
              __typename: 'Message',
              id: 1,
              content: 'Hello World',
              senderId: 2,
              createdAt: new Date().toISOString(),
              sender: { __typename: 'User', id: 2, name: 'Recipient' },
              isEdited: false,
              type: 'TEXT',
              fileUrl: null,
              fileName: null,
              fileSize: null,
              mimeType: null,
              metadata: null,
              linkPreview: null,
              attachments: [],
            },
          ],
        },
      },
    },
    {
      request: {
        query: MARK_AS_READ,
        variables: { conversationId: 1 },
      },
      result: { data: { markAsRead: true } },
    },
    {
      request: { query: GET_USERS },
      result: { data: { users: [] } },
    },
    conversationListMock,
    ...subscriptionMocks,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => selector({ user: { id: 1 } }),
    );
  });

  it('renders messages correctly', async () => {
    render(
      <MockedProvider mocks={apolloMocks}>
        <ChatTestHarness conversation={mockConversation} />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
      expect(conversationListResult).toHaveBeenCalledTimes(2);
    });
  });

  it('shows empty state when no messages', async () => {
    const emptyMocks = [
      {
        request: {
          query: GET_CONVERSATION_MESSAGES,
          variables: { conversationId: 1 },
        },
        result: { data: { conversationMessages: [] } },
      },
      {
        request: {
          query: MARK_AS_READ,
          variables: { conversationId: 1 },
        },
        result: { data: { markAsRead: true } },
      },
      {
        request: { query: GET_USERS },
        result: { data: { users: [] } },
      },
      conversationListMock,
      ...subscriptionMocks,
    ];

    render(
      <MockedProvider mocks={emptyMocks}>
        <ChatTestHarness conversation={mockConversation} />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/Hello World/i)).not.toBeInTheDocument();
      expect(conversationListResult).toHaveBeenCalledTimes(2);
    });
  });
});
