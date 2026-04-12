import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import TimesheetForm from './TimesheetForm';
import { useAuth } from '../../../context/AuthProvider';
import { useTimesheets } from '../hooks/useTimesheets';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET_USERS } from '../../users/gql/user.graphql';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import { GET_TASKS } from '../../tasks/gql/task.graphql';

// Mock hooks
vi.mock('../../../context/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useTimesheets', () => ({
  useTimesheets: vi.fn(),
}));

describe('TimesheetForm', () => {
  const mockCreateRecord = vi.fn();
  const mockRefetch = vi.fn();

  const apolloMocks = [
    {
      request: { query: GET_USERS },
      result: { data: { users: [{ id: 1, name: 'Test User' }] } },
    },
    {
      request: { query: GET_PROJECTS },
      result: { data: { projects: [{ id: 1, name: 'Test Project' }] } },
    },
    {
      request: { query: GET_TASKS },
      result: { data: { tasks: [{ id: 1, title: 'Test Task', project: { id: 1 } }] } },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { id: 1, role: 'ADMIN' } });
    (useTimesheets as any).mockReturnValue({
      createRecord: mockCreateRecord,
      updateRecord: vi.fn(),
      refetch: mockRefetch,
      loading: false,
    });
  });

  it('renders correctly and handles submission', async () => {
    render(
      <MockedProvider mocks={apolloMocks} addTypename={false}>
        <MemoryRouter>
          <TimesheetForm onSuccess={vi.fn()} />
        </MemoryRouter>
      </MockedProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Description/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Description/i), {
      target: { value: 'Working on project' },
    });
    
    fireEvent.change(screen.getByLabelText(/Time Spent/i), {
      target: { value: '5' },
    });

    // Select project and task
    fireEvent.change(screen.getByLabelText(/Project/i), {
      target: { value: '1' },
    });
    
    // Task depends on project selection
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Task/i), {
        target: { value: '1' },
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(mockCreateRecord).toHaveBeenCalled();
      const callArgs = mockCreateRecord.mock.calls[0][0];
      expect(callArgs.variables.input.description).toBe('Working on project');
      expect(callArgs.variables.input.timeSpent).toBe(5);
    });
  });

  it('shows validation error when description is missing', async () => {
    render(
      <MockedProvider mocks={apolloMocks} addTypename={false}>
        <MemoryRouter>
          <TimesheetForm />
        </MemoryRouter>
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
    });
  });
});
