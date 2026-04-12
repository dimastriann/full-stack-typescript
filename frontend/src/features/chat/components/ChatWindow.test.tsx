import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ChatWindow } from './ChatWindow';
import { useAuth } from '../../../context/AuthProvider';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET_CONVERSATION_MESSAGES, MARK_AS_READ } from '../gql/chat.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';

// Mock hooks and services
vi.mock('../../../context/AuthProvider', () => ({
  useAuth: vi.fn(),
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

describe('ChatWindow', () => {
  const mockConversation: any = {
    id: 1,
    name: 'Test Room',
    participants: [
      { id: 101, userId: 1, user: { id: 1, name: 'Sender', email: 'sender@test.com' } },
      { id: 102, userId: 2, user: { id: 2, name: 'Recipient', email: 'recipient@test.com' } },
    ],
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
              id: 1,
              content: 'Hello World',
              senderId: 2,
              createdAt: new Date().toISOString(),
              sender: { id: 2, name: 'Recipient', email: 'recipient@test.com' },
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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { id: 1 } });
  });

  it('renders messages correctly', async () => {
    render(
      <MockedProvider mocks={apolloMocks} addTypename={false}>
        <ChatWindow conversation={mockConversation} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
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
    ];

    render(
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        <ChatWindow conversation={mockConversation} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Hello World/i)).not.toBeInTheDocument();
    });
  });
});
