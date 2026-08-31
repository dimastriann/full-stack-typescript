import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import TaskForm from './TaskForm';
import { useAuthStore } from '../../../store/authStore';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useTasks } from '../hooks/useTasks';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET_TASK_STAGES } from '../gql/task.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';
import { GET_PROJECTS } from '../../projects/gql/project.graphql';
import { GET_CUSTOM_FIELD_DEFINITIONS } from '../../workspaces/gql/custom-field.graphql';

// Mock hooks
vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../store/workspaceStore', () => ({
  useWorkspaceStore: vi.fn(),
}));

vi.mock('../hooks/useTasks', () => ({
  useTasks: vi.fn(),
}));

describe('TaskForm', () => {
  const mockCreateRecord = vi.fn();
  const mockRefetch = vi.fn();

  const apolloMocks = [
    {
      request: {
        query: GET_USERS,
      },
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
      request: {
        query: GET_PROJECTS,
        variables: { workspaceId: 1 },
      },
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
      request: {
        query: GET_TASK_STAGES,
        variables: { workspaceId: 1 },
      },
      result: {
        data: {
          taskStages: [
            {
              __typename: 'TaskStage',
              id: 1,
              title: 'To Do',
              color: '#64748b',
              sequence: 1,
              isCompleted: false,
            },
          ],
        },
      },
    },
    {
      request: {
        query: GET_CUSTOM_FIELD_DEFINITIONS,
        variables: { workspaceId: 1, entityType: 'TASK' },
      },
      result: { data: { customFieldDefinitions: [] } },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRecord.mockResolvedValue({ data: { createTask: { id: 1 } } });
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => selector({ user: { id: 1, role: 'ADMIN' } }),
    );
    (
      useWorkspaceStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((selector) =>
      selector({ activeWorkspace: { id: 1, name: 'Test WS' } }),
    );
    (useTasks as any).mockReturnValue({
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
          <TaskForm onSuccess={vi.fn()} />
        </MemoryRouter>
      </MockedProvider>,
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Task Title/i), {
      target: { value: 'New Test Task' },
    });

    // Select user and project
    fireEvent.change(screen.getByLabelText(/Assigned User/i), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText(/Project/i), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(mockCreateRecord).toHaveBeenCalled();
      const callArgs = mockCreateRecord.mock.calls[0][0];
      expect(callArgs.variables.input.title).toBe('New Test Task');
      expect(callArgs.variables.input.projectId).toBe(1);
    });
  });

  it('shows validation error when title is missing', async () => {
    render(
      <MockedProvider mocks={apolloMocks}>
        <MemoryRouter>
          <TaskForm />
        </MemoryRouter>
      </MockedProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });
  });
});
