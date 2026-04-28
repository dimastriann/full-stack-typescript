import { create } from 'zustand';
import type { Workspace } from '../types/Workspaces';

export interface WorkspaceState {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspace: null,
  workspaces: [],
  loading: true, // starts loading until workspaces are fetched
  setActiveWorkspace: (workspace) => {
    if (workspace) {
      localStorage.setItem('lastWorkspaceId', workspace.id.toString());
    } else {
      localStorage.removeItem('lastWorkspaceId');
    }
    set({ activeWorkspace: workspace });
  },
  setWorkspaces: (workspaces) => {
    // Attempt to automatically set active workspace when workspaces are populated
    const storedWorkspaceId = localStorage.getItem('lastWorkspaceId');
    let newActiveWorkspace = null;

    if (workspaces.length > 0) {
      const restored = workspaces.find((w) => w.id.toString() === storedWorkspaceId);
      newActiveWorkspace = restored ? restored : workspaces[0];
      localStorage.setItem('lastWorkspaceId', newActiveWorkspace.id.toString());
    }

    set({ workspaces, activeWorkspace: newActiveWorkspace, loading: false });
  },
  setLoading: (loading) => set({ loading }),
}));
