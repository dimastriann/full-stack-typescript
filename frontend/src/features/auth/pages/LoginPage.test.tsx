import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import LoginPage from './LoginPage';
import { useAuth } from '../../../context/AuthProvider';
import { LOGIN_MUTATION } from '../gql/auth.graphql';
import { vi, describe, it, expect } from 'vitest';

// Mock the useAuth hook
vi.mock('../../../context/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const mockLogin = vi.fn();
(useAuth as any).mockReturnValue({
  login: mockLogin,
});

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
            access_token: 'mock-token',
            user: { id: 1, email: 'test@example.com', firstName: 'Test' },
          },
        },
      },
    },
  ];

  it('renders login form correctly', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </MockedProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        access_token: 'mock-token',
        user: { id: 1, email: 'test@example.com', firstName: 'Test' },
      });
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
      <MockedProvider mocks={errorMocks} addTypename={false}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </MockedProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });
});
