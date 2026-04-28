import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import ProjectForm from './ProjectForm';
import { useAuthStore } from '../../../store/authStore';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useProjects } from '../hooks/useProjects';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET_PROJECTS, GET_PROJECT_STAGES } from '../gql/project.graphql';
import { GET_USERS } from '../../users/gql/user.graphql';

// Mock focus/hooks
vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../store/workspaceStore', () => ({
  useWorkspaceStore: vi.fn(),
}));

vi.mock('../hooks/useProjects', () => ({
  useProjects: vi.fn(),
}));

describe('ProjectForm', () => {
  const mockCreateRecord = vi.fn();
  const mockRefetch = vi.fn();

  const apolloMocks = [
    {
      request: {
        query: GET_PROJECTS,
        variables: { workspaceId: 1 },
      },
      result: { data: { projects: [] } },
    },
    {
      request: { query: GET_USERS },
      result: { data: { users: [{ id: 1, name: 'Admin', email: 'admin@test.com' }] } },
    },
    {
      request: {
        query: GET_PROJECT_STAGES,
        variables: { workspaceId: 1 },
      },
      result: { data: { projectStages: [{ id: 1, title: 'In Planning' }] } },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
      selector({ user: { id: 1, role: 'ADMIN' } }),
    );
    (useWorkspaceStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
      selector({ activeWorkspace: { id: 1, name: 'Test WS' } }),
    );
    (useProjects as any).mockReturnValue({
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
          <ProjectForm onSuccess={vi.fn()} />
        </MemoryRouter>
      </MockedProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Project Name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Project Name/i), {
      target: { value: 'New Test Project' },
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Project Description/i), {
      target: { value: 'Test description' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(mockCreateRecord).toHaveBeenCalled();
      const callArgs = mockCreateRecord.mock.calls[0][0];
      expect(callArgs.variables.createProjectInput.name).toBe('New Test Project');
    });
  });

  it('shows validation error when name is missing', async () => {
    render(
      <MockedProvider mocks={apolloMocks} addTypename={false}>
        <MemoryRouter>
          <ProjectForm />
        </MemoryRouter>
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText(/Project Name is required/i)).toBeInTheDocument();
    });
  });
});
