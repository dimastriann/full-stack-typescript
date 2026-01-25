import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Workspace } from '../types/Workspaces';
import { useAuth } from './AuthProvider';

type WorkspaceContextType = {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  workspaces: Workspace[];
  loading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeWorkspace: null,
  setActiveWorkspace: () => {},
  workspaces: [],
  loading: true,
});

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(
    null,
  );
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.workspaceMembers) {
      const availableWorkspaces = user.workspaceMembers.map(
        (m: any) => m.workspace,
      );
      setWorkspaces(availableWorkspaces);

      // Try to restore from localStorage or default to the first one
      const storedWorkspaceId = localStorage.getItem('lastWorkspaceId');
      const restored = availableWorkspaces.find(
        (w: Workspace) => w.id.toString() === storedWorkspaceId,
      );

      if (restored) {
        setActiveWorkspaceState(restored);
      } else if (availableWorkspaces.length > 0) {
        setActiveWorkspaceState(availableWorkspaces[0]);
      }
      setLoading(false);
    } else {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setLoading(false);
    }
  }, [user]);

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    localStorage.setItem('lastWorkspaceId', workspace.id.toString());
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
        workspaces,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
