import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import TimesheetForm from './TimesheetForm';
import { useAuthStore } from '../../../store/authStore';
import { useTimesheets } from '../hooks/useTimesheets';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET_USERS } from '../../users/gql/user.graphql';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import { GET_TASKS } from '../../tasks/gql/task.graphql';

// Mock hooks
vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(),
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
      result: {
        data: {
          users: [
            {
              __typename: 'User',
              id: 1,
              name: 'Test User',
              email: 'test@example.com',
              role: 'MEMBER',
              status: 'ACTIVE',
              firstName: 'Test',
              lastName: 'User',
              mobile: null,
              birthDate: null,
              address: null,
              bio: null,
            },
          ],
        },
      },
    },
    {
      request: { query: GET_PROJECTS },
      result: {
        data: {
          projects: [
            {
              __typename: 'Project',
              id: 1,
              name: 'Test Project',
              description: null,
              workspaceId: 1,
              stageId: 1,
              sequence: 1,
              budgetPlanned: null,
              budgetActual: null,
              startDate: null,
              endDate: null,
              phasesCount: null,
              methodology: null,
              key: 'TEST',
              visibility: 'PRIVATE',
              priority: 'MEDIUM',
              progress: 0,
              currency: 'USD',
              totalHours: 0,
              stage: null,
              responsibleId: null,
              responsible: null,
              members: [],
            },
          ],
        },
      },
    },
    {
      request: { query: GET_TASKS },
      result: {
        data: {
          tasks: [
            {
              __typename: 'Task',
              id: 1,
              title: 'Test Task',
              description: null,
              stageId: 1,
              sequence: 1,
              type: 'TASK',
              priority: 'MEDIUM',
              estimatedHours: null,
              actualHours: null,
              remainingHours: null,
              progress: 0,
              dueDate: null,
              startDate: null,
              completedAt: null,
              tags: [],
              stage: null,
              user: null,
              reporter: null,
              project: { __typename: 'Project', id: 1, name: 'Test Project' },
              parentTaskId: null,
            },
          ],
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => selector({ user: { id: 1, role: 'ADMIN' } }),
    );
    (useTimesheets as any).mockReturnValue({
      createRecord: mockCreateRecord,
      updateRecord: vi.fn(),
      refetch: mockRefetch,
      loading: false,
    });
  });

  it('renders correctly and handles submission', async () => {
    render(
      <MockedProvider mocks={apolloMocks}>
        <MemoryRouter>
          <TimesheetForm onSuccess={vi.fn()} />
        </MemoryRouter>
      </MockedProvider>,
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Description/i), {
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
      <MockedProvider mocks={apolloMocks}>
        <MemoryRouter>
          <TimesheetForm />
        </MemoryRouter>
      </MockedProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
    });
  });
});
