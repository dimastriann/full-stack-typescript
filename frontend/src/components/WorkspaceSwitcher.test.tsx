import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useWorkspaceStore } from '../store/workspaceStore';
import { CREATE_WORKSPACE } from '../features/workspaces/gql/workspace.graphql';
import { GET_ME } from '../features/auth/gql/auth.graphql';
import type { Workspace } from '../types/Workspaces';

const existing: Workspace = {
  id: 1,
  name: 'Alpha Team',
  description: '',
} as Workspace;

const created: Workspace = {
  id: 2,
  name: 'Beta Team',
  description: '',
} as Workspace;

const mocks = [
  {
    request: {
      query: CREATE_WORKSPACE,
      variables: {
        createWorkspaceInput: { name: 'Beta Team', description: '' },
      },
    },
    result: {
      data: {
        createWorkspace: {
          __typename: 'Workspace',
          id: 2,
          name: 'Beta Team',
          description: '',
        },
      },
    },
  },
  {
    request: { query: GET_ME },
    result: {
      data: {
        me: {
          __typename: 'User',
          id: 1,
          email: 'admin@example.com',
          name: 'Admin',
          role: 'ADMIN',
          firstName: 'Admin',
          lastName: 'User',
          twoFactorEnabled: false,
          workspaceMembers: [
            {
              __typename: 'WorkspaceMember',
              id: 1,
              role: 'OWNER',
              workspace: {
                __typename: 'Workspace',
                id: 1,
                name: 'Alpha Team',
                description: '',
              },
            },
          ],
        },
      },
    },
  },
];

function renderSwitcher() {
  const result = render(
    <MockedProvider mocks={mocks} addTypename>
      <WorkspaceSwitcher />
    </MockedProvider>,
  );
  const select = result.container.querySelector('select');
  if (!select) throw new Error('workspace select not rendered');
  return { ...result, select };
}

describe('WorkspaceSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspaceStore.setState({
      activeWorkspace: existing,
      workspaces: [existing],
      loading: false,
    });
  });

  it('shows the active workspace and lists a create option', () => {
    const { select } = renderSwitcher();

    expect(
      screen.getByRole('button', { name: /alpha team/i }),
    ).toBeInTheDocument();
    const labels = Array.from(select.options).map((option) => option.text);
    expect(labels).toContain('Alpha Team');
    expect(labels).toContain('+ Create Workspace');
  });

  it('creates a workspace through the modal and activates it', async () => {
    const { select } = renderSwitcher();

    fireEvent.change(select, { target: { value: 'new' } });
    const nameInput = await screen.findByPlaceholderText('My Awesome Team');
    fireEvent.change(nameInput, { target: { value: 'Beta Team' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(useWorkspaceStore.getState().activeWorkspace?.id).toBe(created.id);
    });
    expect(useWorkspaceStore.getState().workspaces.map((w) => w.name)).toEqual([
      'Alpha Team',
      'Beta Team',
    ]);
    expect(localStorage.getItem('lastWorkspaceId')).toBe('2');
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText('My Awesome Team'),
      ).not.toBeInTheDocument();
    });
  });

  it('switches the active workspace from the dropdown', () => {
    const second = { id: 9, name: 'Gamma Team', description: '' } as Workspace;
    useWorkspaceStore.setState({
      activeWorkspace: existing,
      workspaces: [existing, second],
      loading: false,
    });
    const { select } = renderSwitcher();

    fireEvent.change(select, { target: { value: '9' } });

    expect(useWorkspaceStore.getState().activeWorkspace?.id).toBe(9);
    expect(localStorage.getItem('lastWorkspaceId')).toBe('9');
  });

  it('does not submit an empty workspace name', async () => {
    const { select } = renderSwitcher();

    fireEvent.change(select, { target: { value: 'new' } });
    await screen.findByPlaceholderText('My Awesome Team');
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(useWorkspaceStore.getState().workspaces).toHaveLength(1);
    });
    expect(screen.getByPlaceholderText('My Awesome Team')).toBeInTheDocument();
  });
});
