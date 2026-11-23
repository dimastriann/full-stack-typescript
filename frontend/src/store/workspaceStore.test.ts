import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspaceStore } from './workspaceStore';
import type { Workspace } from '../types/Workspaces';

const workspace = (id: number, name: string): Workspace =>
  ({ id, name, description: '' }) as Workspace;

describe('workspaceStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useWorkspaceStore.setState({
      activeWorkspace: null,
      workspaces: [],
      loading: true,
    });
  });

  it('persists the active workspace id when selecting one', () => {
    useWorkspaceStore.getState().setActiveWorkspace(workspace(7, 'Team'));

    expect(useWorkspaceStore.getState().activeWorkspace?.id).toBe(7);
    expect(localStorage.getItem('lastWorkspaceId')).toBe('7');
  });

  it('clears the persisted id when the active workspace is reset', () => {
    localStorage.setItem('lastWorkspaceId', '7');

    useWorkspaceStore.getState().setActiveWorkspace(null);

    expect(useWorkspaceStore.getState().activeWorkspace).toBeNull();
    expect(localStorage.getItem('lastWorkspaceId')).toBeNull();
  });

  it('restores the last used workspace when it is still available', () => {
    localStorage.setItem('lastWorkspaceId', '2');

    useWorkspaceStore
      .getState()
      .setWorkspaces([workspace(1, 'First'), workspace(2, 'Second')]);

    expect(useWorkspaceStore.getState().activeWorkspace?.id).toBe(2);
    expect(useWorkspaceStore.getState().loading).toBe(false);
  });

  it('falls back to the first workspace when the stored id is gone', () => {
    localStorage.setItem('lastWorkspaceId', '999');

    useWorkspaceStore
      .getState()
      .setWorkspaces([workspace(3, 'Only'), workspace(4, 'Other')]);

    expect(useWorkspaceStore.getState().activeWorkspace?.id).toBe(3);
    expect(localStorage.getItem('lastWorkspaceId')).toBe('3');
  });

  it('clears the active workspace when no workspaces are available', () => {
    useWorkspaceStore.getState().setActiveWorkspace(workspace(1, 'Old'));
    useWorkspaceStore.getState().setWorkspaces([]);

    expect(useWorkspaceStore.getState().activeWorkspace).toBeNull();
    expect(useWorkspaceStore.getState().loading).toBe(false);
  });

  it('tracks the loading flag independently', () => {
    useWorkspaceStore.getState().setLoading(false);
    expect(useWorkspaceStore.getState().loading).toBe(false);

    useWorkspaceStore.getState().setLoading(true);
    expect(useWorkspaceStore.getState().loading).toBe(true);
  });
});
