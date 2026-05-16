import { useWorkspaceStore } from '../store/workspaceStore';
import Modal from './Dialog';
import Select from './Select';
import { useMutation } from '@apollo/client';
import { GET_ME } from '../features/auth/gql/auth.graphql';
import { CREATE_WORKSPACE } from '../features/workspaces/gql/workspace.graphql';
import { useState } from 'react';
import Logger from '../lib/logger';

export const WorkspaceSwitcher = () => {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const setActiveWorkspace = useWorkspaceStore(
    (state) => state.setActiveWorkspace,
  );
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [createWorkspace] = useMutation(CREATE_WORKSPACE, {
    refetchQueries: [{ query: GET_ME }],
  });

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      await createWorkspace({
        variables: {
          createWorkspaceInput: { name: newWorkspaceName, description: '' },
        },
      });
      setNewWorkspaceName('');
      setIsModalOpen(false);
    } catch (err) {
      Logger.error(err as string);
      alert('Failed to create workspace');
    }
  };

  const selectOptions = [
    ...workspaces.map((w) => ({ id: w.id, label: w.name })),
    { id: 'new', label: '+ Create Workspace' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={activeWorkspace?.id || ''}
        options={selectOptions}
        onChange={(val: string | number) => {
          if (val === 'new') {
            setIsModalOpen(true);
          } else {
            const workspace = workspaces.find((w) => w.id === val);
            if (workspace) setActiveWorkspace(workspace);
          }
        }}
        alwaysDark
        className="w-48"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Workspace"
      >
        <div className="space-y-4">
          <div>
            <label className="label-modern">Workspace Name</label>
            <input
              type="text"
              className="input-modern"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="My Awesome Team"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-800 rounded-xl hover:bg-surface-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-8 py-2 text-sm font-bold text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
