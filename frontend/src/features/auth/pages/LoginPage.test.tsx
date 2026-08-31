import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import LoginPage from './LoginPage';
import { useAuthStore } from '../../../store/authStore';
import { LOGIN_MUTATION } from '../gql/auth.graphql';
import { vi, describe, it, expect } from 'vitest';

// Mock the useAuthStore hook
vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockLogin = vi.fn();
(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
  (selector) => {
    return selector({ setAuth: mockLogin });
  },
);

describe('LoginPage', () => {
  const mocks = [
    {
      request: {
        query: LOGIN_MUTATION,
        variables: { email: 'test@example.com', password: 'password123' },
      },
      result: {
        data: {
          login: {
            __typename: 'AuthPayload',
            access_token: 'mock-token',
            requiresTwoFactor: false,
            preAuthToken: null,
            user: {
              __typename: 'User',
              id: 1,
              name: 'Test User',
              email: 'test@example.com',
              role: 'MEMBER',
              twoFactorEnabled: false,
              workspaceMembers: [],
            },
          },
        },
      },
    },
  ];

  it('renders login form correctly', () => {
    render(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </MockedProvider>,
    );

    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign in/i }),
    ).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </MockedProvider>,
    );

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        {
          __typename: 'User',
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'MEMBER',
          twoFactorEnabled: false,
          workspaceMembers: [],
        },
        'logged_in',
      );
    });
  });

  it('displays error message on failed login', async () => {
    const errorMocks = [
      {
        request: {
          query: LOGIN_MUTATION,
          variables: { email: 'test@example.com', password: 'wrong-password' },
        },
        error: new Error('Invalid credentials'),
      },
    ];

    render(
      <MockedProvider mocks={errorMocks}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </MockedProvider>,
    );

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid email or password/i),
      ).toBeInTheDocument();
    });
  });
});
